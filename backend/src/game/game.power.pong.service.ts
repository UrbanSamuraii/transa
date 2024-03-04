import { Injectable } from '@nestjs/common';
import { PlayerInfo } from './game.gateway';

const nbrOfSquares = 1;
const aspectRatio = 1318 / 807;
const paddleDistToWall = 1;
const paddleWidth = 2.26;
const paddleHeight = 18;
const leftPaddleY = 40;
const leftPaddleX = paddleDistToWall;
const rightPaddleY = 40;
const rightPaddleX = 100 - paddleWidth - paddleDistToWall;
const squareSize = 2.2;
const squareDy = 0;
const squareDx = 1.25;

enum PowerType {
    Expand = 'Expand',
    SpeedBoost = 'SpeedBoost',
    MultiBall = 'MultiBall',
}

interface Power {
    type: PowerType;
    duration: number; // in milliseconds
}

@Injectable()
export class PowerPongGameService {

    private gameStates = new Map<string, any>();


    private angleFactor = 5;  // Adjust this value to make the effect stronger or weaker.

    private initializeGameState(playerInfoMap: any) {
        const playerInfos = Array.from(playerInfoMap.values());
        return {
            squares: Array.from({ length: nbrOfSquares }, (_, index) => {
                return {
                    x: 50,
                    y: (100 / nbrOfSquares) * index,
                    dx: squareDx,
                    dy: squareDy,
                    size: squareSize
                };
            }),
            leftPaddle: {
                x: leftPaddleX,
                y: leftPaddleY,
                width: paddleWidth,
                height: paddleHeight
            },
            rightPaddle: {
                x: rightPaddleX,
                y: rightPaddleY,
                width: paddleWidth,
                height: paddleHeight
            },
            leftScore: 0,
            rightScore: 0,
            isGameOver: false,
            width: 100,
            height: 100,
            rightWall: { x: 0, y: 0, width: 0, height: 100 },
            leftWall: { x: 100, y: 0, width: 0, height: 100 },
            topWall: { x: 0, y: 0, width: 100, height: 0 },
            BottomWall: { x: 0, y: 100, width: 100, height: 0 },
            gameLoop: null, // or appropriate initial value
            moveLeftPaddleDirection: null,
            moveRightPaddleDirection: null,
            paddleMoveAmount: 2,
            desiredLeftPaddleMovement: null,
            desiredRightPaddleMovement: null,
            maxDyValue: 5,
            maxDxValue: 5,
            angleFactor: 5,
            leftPlayerInfo: playerInfos[0],
            rightPlayerInfo: playerInfos[1],
        };
    }

    adjustDyOnCollision(distanceFromCenter, paddleHeight) {
        const relativeDistance = distanceFromCenter / paddleHeight;
        return (relativeDistance) * this.angleFactor;
    }

    updateGameState(gameId: number, playerInfoMap: Map<string, PlayerInfo>, callback: Function) {
        let gameState = this.gameStates.get(gameId.toString());
        if (!gameState) {
            // Initialize game state for new gameId
            gameState = this.initializeGameState(playerInfoMap);
            this.gameStates.set(gameId.toString(), gameState);

        }
        const playerInfos = Array.from(playerInfoMap.values());
        const currentTime = Date.now();
        const fillRatePerSecond = 20;
        const fillRatePerMs = fillRatePerSecond / 1000;
        if (playerInfos.length >= 2) {
            let gameState = this.gameStates.get(gameId.toString());
            if (!gameState) {
                gameState = this.initializeGameState(playerInfoMap);
                this.gameStates.set(gameId.toString(), gameState);
            }

            if (!gameState.leftPlayerInfo.selectedPower) {
                gameState.leftPlayerInfo.selectedPower = this.selectRandomPower();
            }

            if (!gameState.rightPlayerInfo.selectedPower) {
                gameState.rightPlayerInfo.selectedPower = this.selectRandomPower();
            }

            if (gameState.leftPlayerInfo.powerBarLevel < 100) {
                const timeSinceLastActivationLeft = currentTime - gameState.leftPlayerInfo.lastPowerActivation;
                // console.log(`timeSinceLastActivationLeft: ${timeSinceLastActivationLeft}`)
                gameState.leftPlayerInfo.powerBarLevel = Math.min(100, timeSinceLastActivationLeft * fillRatePerMs);
                // console.log(`gameState.leftPlayerInfo.powerBarLevel: ${gameState.leftPlayerInfo.powerBarLevel}`)
            }

            if (gameState.rightPlayerInfo.powerBarLevel < 100) {
                const timeSinceLastActivationRight = currentTime - gameState.rightPlayerInfo.lastPowerActivation;
                gameState.rightPlayerInfo.powerBarLevel = Math.min(100, timeSinceLastActivationRight * fillRatePerMs);
            }

            // Handle left player paddle movement
            if (gameState.leftPlayerInfo.activeKeys.includes("w")) {
                const potentialY = gameState.leftPaddle.y - gameState.paddleMoveAmount;
                gameState.leftPaddle.y = Math.max(potentialY, 0);
            } else if (gameState.leftPlayerInfo.activeKeys.includes("s")) {
                const potentialY = gameState.leftPaddle.y + gameState.paddleMoveAmount;
                gameState.leftPaddle.y = Math.min(potentialY, 100 - gameState.leftPaddle.height);
            }

            // Handle right player paddle movement
            if (gameState.rightPlayerInfo.activeKeys.includes("ArrowUp")) {
                const potentialY = gameState.rightPaddle.y - gameState.paddleMoveAmount;
                gameState.rightPaddle.y = Math.max(potentialY, 0);
            } else if (gameState.rightPlayerInfo.activeKeys.includes("ArrowDown")) {
                const potentialY = gameState.rightPaddle.y + gameState.paddleMoveAmount;
                gameState.rightPaddle.y = Math.min(potentialY, 100 - gameState.rightPaddle.height);
            }
            if (gameState.leftPlayerInfo.activeKeys.includes(" ") && gameState.leftPlayerInfo.powerBarLevel === 100) {
                this.activatePower(gameState.leftPlayerInfo, gameState);
            }

            if (gameState.rightPlayerInfo.activeKeys.includes(" ") && gameState.rightPlayerInfo.powerBarLevel === 100) {
                this.activatePower(gameState.rightPlayerInfo, gameState);
            }

            gameState.squares.forEach((square, idx) => {

                square.x += square.dx;
                square.y += square.dy;

                const leftPaddleDistance = this.intersects(square, gameState.leftPaddle);
                if (leftPaddleDistance !== null) {
                    square.dx = -square.dx;
                    square.dy = this.adjustDyOnCollision(leftPaddleDistance, gameState.leftPaddle.height);

                    // Reposition the square outside of the left paddle bounds
                    square.x = gameState.leftPaddle.x + gameState.leftPaddle.width;
                }

                const rightPaddleDistance = this.intersects(square, gameState.rightPaddle);
                if (rightPaddleDistance !== null) {
                    square.dx = -square.dx;
                    square.dy = this.adjustDyOnCollision(rightPaddleDistance, gameState.rightPaddle.height);

                    // Reposition the square outside of the right paddle bounds
                    square.x = gameState.rightPaddle.x - square.size;

                }

                // Check for wall intersections
                if (square.x + square.size < 0 || square.x > gameState.width) {
                    // Reset square position to the center
                    if (square.x > gameState.width) gameState.leftPlayerInfo.score++;
                    if (square.x + square.size < 0) gameState.rightPlayerInfo.score++;
                    square.x = gameState.width / 2;
                    square.y = gameState.height / 2;

                    square.dx = squareDx;
                    square.dy = squareDy;
                }

                //top wall
                if (square.y <= 0) {
                    square.dy = -square.dy;
                }

                //bottom wall
                if (square.y + square.size * aspectRatio >= 100) {
                    square.dy = -square.dy;
                }

            });

            gameState.leftScore = gameState.leftPlayerInfo.score;
            gameState.rightScore = gameState.rightPlayerInfo.score; //both lines are placeholders to remove when i do frontend
            if (gameState.leftScore >= 10 || gameState.rightScore >= 10) {
                gameState.isGameOver = true;
                clearInterval(gameState.gameLoop); // Clear the game loop to stop the game
                const winnerUsername = gameState.leftPlayerInfo.score > gameState.rightPlayerInfo.score ? gameState.leftPlayerInfo.username : gameState.rightPlayerInfo.username;
                const loserUsername = gameState.leftPlayerInfo.score < gameState.rightPlayerInfo.score ? gameState.leftPlayerInfo.username : gameState.rightPlayerInfo.username;

                const winnerInfo = playerInfoMap.get(winnerUsername);
                const loserInfo = playerInfoMap.get(loserUsername);
                const winnerEloChange = winnerInfo.potentialEloGain;
                const loserEloChange = loserInfo.potentialEloLoss;

                callback({
                    squares: gameState.squares,
                    leftPaddle: gameState.leftPaddle,
                    rightPaddle: gameState.rightPaddle,
                    leftScore: gameState.leftScore,
                    rightScore: gameState.rightScore,
                    isGameOver: gameState.isGameOver,
                    winnerUsername: winnerUsername,
                    loserUsername: loserUsername,
                    winnerEloChange: winnerEloChange,
                    loserEloChange: loserEloChange,
                    winnerCurrentElo: winnerInfo.currentElo,
                    loserCurrentElo: loserInfo.currentElo,
                    leftPlayerInfo: {
                        username: gameState.leftPlayerInfo.username,
                        powerBarLevel: gameState.leftPlayerInfo.powerBarLevel,
                        currentPower: gameState.leftPlayerInfo.selectedPower
                    },
                    rightPlayerInfo: {
                        username: gameState.rightPlayerInfo.username,
                        powerBarLevel: gameState.rightPlayerInfo.powerBarLevel,
                        currentPower: gameState.rightPlayerInfo.selectedPower
                    },
                });
            } else {
                callback({
                    squares: gameState.squares,
                    leftPaddle: gameState.leftPaddle,
                    rightPaddle: gameState.rightPaddle,
                    leftScore: gameState.leftScore,
                    rightScore: gameState.rightScore,
                    isGameOver: gameState.isGameOver,
                    leftPlayerInfo: {
                        username: gameState.leftPlayerInfo.username,
                        powerBarLevel: gameState.leftPlayerInfo.powerBarLevel,
                        currentPower: gameState.leftPlayerInfo.selectedPower
                    },
                    rightPlayerInfo: {
                        username: gameState.rightPlayerInfo.username,
                        powerBarLevel: gameState.rightPlayerInfo.powerBarLevel,
                        currentPower: gameState.rightPlayerInfo.selectedPower
                    },
                });

                if (!gameState.isGameOver) {
                    setTimeout(() => this.updateGameState(gameId, playerInfoMap, callback), 1000 / 60);
                }
            }
        }
    }

    recIntersects(rectA, rectB) {
        return rectA.x < rectB.x + rectB.size &&
            rectA.x + rectA.size > rectB.x &&
            rectA.y < rectB.y + rectB.size &&
            rectA.y + rectA.size > rectB.y;
    }

    private applyPowerEffect(playerInfo: PlayerInfo, gameState: any) {
        const paddle = playerInfo.username === gameState.leftPlayerInfo.username
            ? gameState.leftPaddle
            : gameState.rightPaddle;

        switch (playerInfo.selectedPower.type) {
            case PowerType.Expand:
                paddle.height *= 1.5; // Increase paddle height by 50%
                break;
            case PowerType.SpeedBoost:
                gameState.squares.forEach(square => square.dx *= 1.5); // Increase ball speed by 50%
                gameState.squares.forEach(square => square.dy *= 1.5); // Increase ball speed by 50%
                break;
            case PowerType.MultiBall:
                // Logic to duplicate the current squares (balls) in play
                const dys = gameState.squares.map(_ => Math.random() * 3)
                gameState.squares = [...gameState.squares, ...gameState.squares.map(square => ({ ...square }))];
                for (let i = 0; i < dys.length; ++i) {
                    gameState.squares[i].dy += dys[i]
                    gameState.squares[i + dys.length].dy -= dys[i]
                }
                break;
        }
    }

    private removePowerEffect(playerInfo: PlayerInfo, gameState: any) {
        const paddle = playerInfo.username === gameState.leftPlayerInfo.username
            ? gameState.leftPaddle
            : gameState.rightPaddle;

        switch (playerInfo.selectedPower.type) {
            case PowerType.Expand:
                paddle.height /= 1.5; // Revert paddle height to original
                break;
            case PowerType.SpeedBoost:
                gameState.squares.forEach(square => square.dx /= 1.5); // Revert ball speed to original
                gameState.squares.forEach(square => square.dy /= 1.5); // Revert ball speed to original
                break;
            case PowerType.MultiBall:
                // Logic to remove the additional squares (balls), assuming we duplicate them earlier
                // gameState.squares.splice(gameState.squares.length / 2);
                break;
        }
    }

    private createPower(type: PowerType): Power {
        return {
            type: type,
            duration: 5000, // Default duration for all powers, change if necessary
        };
    }

    private selectRandomPower(exclude?: PowerType): Power {
        const powers = Object.values(PowerType).filter(p => p !== exclude);
        const randomType = powers[Math.floor(Math.random() * powers.length)];
        return this.createPower(randomType);
    }

    private activatePower(playerInfo: PlayerInfo, gameState: any) {
        // console.log("Entering activatePower function");
        // console.log("playerInfo:", playerInfo);

        if (!playerInfo || !playerInfo.selectedPower || playerInfo.powerBarLevel < 100) {
            console.log("Exiting activatePower due to condition check");
            return;
        }

        // console.log(`Activating power for ${playerInfo.username}: ${playerInfo.selectedPower.type}`);

        // Apply the power effect immediately
        this.applyPowerEffect(playerInfo, gameState);
        playerInfo.lastPowerActivation = Date.now();
        playerInfo.powerBarLevel = 0;
        playerInfo.selectedPower = this.selectRandomPower(playerInfo.selectedPower.type);
        // Set a timeout to end the power effect after its duration
        setTimeout(() => {
            this.removePowerEffect(playerInfo, gameState);
        }, playerInfo.selectedPower.duration);
    }

    intersects(square, paddle) {
        if (
            square.x + square.size > paddle.x &&
            square.x < paddle.x + paddle.width &&
            square.y + square.size * aspectRatio > paddle.y &&
            square.y < paddle.y + paddle.height
        ) {
            // Calculate the distance between the center of the paddle and the center of the square
            const squareCenterY = square.y + (square.size * aspectRatio) / 2;
            const paddleCenterY = paddle.y + paddle.height / 2;
            const distance = squareCenterY - paddleCenterY;

            // Return the distance
            return distance;
        }
        return null;
    }

}