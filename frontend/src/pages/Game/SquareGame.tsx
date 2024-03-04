import { useState, useEffect, useRef, useCallback } from 'react';
import './SquareGame.css';
import { getCookie } from '../../utils/cookies'
import { useSocket } from '../../SocketContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const targetAspectRatio = 1318 / 807;
const TARGET_WIDTH = 1318;
const TARGET_HEIGHT = 807;

type Button = {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    callback: () => void;
};

function SquareGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeKeys, setActiveKeys] = useState<string[]>([]);
    const activeKeysRef = useRef<string[]>(activeKeys);
    const [isGamePaused, setGamePaused] = useState(false);
    const { socket } = useSocket();
    const { id: gameId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const lastSentWasEmptyRef = useRef(true);
    const { user } = useAuth();
    const username = user?.username || 'Guest';
    const [gameData, setGameData] = useState(null);
    const [buttons, setButtons] = useState<Button[]>([]);

    useEffect(() => {
        activeKeysRef.current = activeKeys;
    }, [activeKeys]);

    const goBackToMainMenu = useCallback(() => {
        navigate("/");
    }, [navigate]);

    const goBackToSelectMode = useCallback(() => {
        navigate("/select-mode");
    }, [navigate]);

    const drawButton = useCallback((x: number, y: number, width: number, height: number, text: string, callback: () => void) => {
        console.log(`Drawing button with text: ${text}`);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const borderThickness = width / 50;
        ctx.lineWidth = borderThickness;

        ctx.fillStyle = '#0d0d0e';
        ctx.fillRect(x, y, width, height);

        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(x, y, width, height);

        const fontSize = width / 7;

        ctx.fillStyle = '#ffffff';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';

        ctx.fillText(text, x + width / 2, y + height / 2 + fontSize / 4);

        return { x, y, width, height, callback, text };
    }, []);

    const drawNet = useCallback((data: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const numberOfSquares = 15;

        const canvasAspectRatio = canvas.width / canvas.height;
        let gameWidth, gameHeight;
        if (canvasAspectRatio > targetAspectRatio) {
            gameHeight = canvas.height;
            gameWidth = gameHeight * targetAspectRatio;
        } else {
            gameWidth = canvas.width;
            gameHeight = gameWidth / targetAspectRatio;
        }
        const offsetX = (canvas.width - gameWidth) / 2;
        const offsetY = (canvas.height - gameHeight) / 2;

        const pixelSize = data.squares[0].size * gameWidth / 100; // Assuming the first square in data.squares is representative

        const gap = pixelSize;

        ctx.fillStyle = 'white';

        for (let i = 0; i < numberOfSquares; i++) {
            // const x = offsetX + (gameWidth.width / 2) - (pixelSize / 2); // Center it
            const x = offsetX + (gameWidth / 2) - (pixelSize / 2); // Center it within the game area
            // const x = offsetX + (canvas.width / 2) - (pixelSize / 2); // Center it
            const y = offsetY + i * (pixelSize + gap);
            ctx.fillRect(x, y, pixelSize, pixelSize);
        }
    }, []);

    const drawGame = useCallback((data: any) => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const canvasAspectRatio = canvas.width / canvas.height;

        let gameWidth: number, gameHeight: number;

        if (canvasAspectRatio > targetAspectRatio) {
            gameHeight = canvas.height;
            gameWidth = gameHeight * targetAspectRatio;
        } else {
            gameWidth = canvas.width;
            gameHeight = gameWidth / targetAspectRatio;
        }

        const offsetX = (canvas.width - gameWidth) / 2;
        const offsetY = (canvas.height - gameHeight) / 2;

        // Draw squares
        data.squares.forEach((square: any) => {
            const pixelX = offsetX + square.x * gameWidth / 100;
            const pixelY = offsetY + square.y * gameHeight / 100;
            const pixelSize = square.size * gameWidth / 100;
            const pixelSize2 = square.size * gameWidth / 100;
            ctx.fillStyle = "white";
            ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize2);
        });

        // Draw paddles
        ['leftPaddle', 'rightPaddle'].forEach(paddleName => {
            const paddle = data[paddleName];
            const pixelX = offsetX + paddle.x * gameWidth / 100;
            const pixelY = offsetY + paddle.y * gameHeight / 100;
            const pixelWidth = paddle.width * gameWidth / 100;
            const pixelHeight = paddle.height * gameHeight / 100;
            ctx.fillRect(pixelX, pixelY, pixelWidth, pixelHeight);
        });
        setButtons([]);

        if (data.isGameOver) {
            const buttonOffsetY = gameHeight * 0.6;
            const winnerNameFontSize = gameHeight * 0.06;
            const textOffsetY = buttonOffsetY - winnerNameFontSize * 2;
            const eloTextOffsetY = textOffsetY + winnerNameFontSize + 5; // Below the winner's name
            const buttonWidth = gameWidth * 0.3;
            const buttonHeight = gameHeight * 0.1;
            const eloFontSize = winnerNameFontSize * 0.75;

            // Determine the winner's side for X positioning
            const winnerSideX = data.leftScore > data.rightScore ? gameWidth * 0.25 : gameWidth * 0.75;

            // Set up font and style for the winner's name
            ctx.font = `${winnerNameFontSize}px 'Press Start 2P', cursive`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';

            // Calculate positions based on winner's side
            const textX = offsetX + winnerSideX;
            const buttonX = textX - buttonWidth / 2; // Center the button on the winner's side

            // Draw winner message
            ctx.fillText(`Winner: ${data.winnerUsername}`, textX, offsetY + textOffsetY);
            const localPlayerUsername = username;

            // Determine if the local player is the winner or loser
            const isLocalPlayerWinner = localPlayerUsername === data.winnerUsername;
            const isLocalPlayerLoser = localPlayerUsername === data.loserUsername;
            console.log("Is Local Player Winner:", isLocalPlayerWinner);
            console.log("Is Local Player Loser:", isLocalPlayerLoser);
            console.log("data.winnerEloChange:", data.winnerEloChange);
            console.log("data.loserEloChange:", data.loserEloChange);

            const localPlayerCurrentElo = isLocalPlayerWinner ? data.winnerCurrentElo : (isLocalPlayerLoser ? data.loserCurrentElo : null);
            const localPlayerEloChange = isLocalPlayerWinner ? data.winnerEloChange : (isLocalPlayerLoser ? data.loserEloChange : 0);
            console.log("Local Player Current ELO:", localPlayerCurrentElo);
            console.log("Local Player ELO Change:", localPlayerEloChange);

            const newElo = localPlayerCurrentElo + localPlayerEloChange;
            console.log("New ELO:", newElo);

            ctx.font = `${eloFontSize}px 'Press Start 2P', cursive`;
            const eloChangeText = `Your ELO: ${newElo}`;
            ctx.fillText(eloChangeText, textX, offsetY + eloTextOffsetY);

            const newButtonMenu = drawButton(buttonX, offsetY + buttonOffsetY, buttonWidth, buttonHeight, 'MAIN MENU', goBackToMainMenu);
            const newButtonPlayAgain = drawButton(buttonX, offsetY + buttonOffsetY + buttonHeight * 1.5, buttonWidth, buttonHeight, 'PLAY AGAIN', goBackToSelectMode);
            setButtons(currentButtons => [
                ...currentButtons,
                ...(newButtonMenu ? [newButtonMenu] : []),
                ...(newButtonPlayAgain ? [newButtonPlayAgain] : [])
            ]);
            console.log('Game over detected.');
        }

        drawNet(data);

        const fontSize = 100 * gameWidth / 1920;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(data.leftScore, offsetX + 0.25 * gameWidth, offsetY + fontSize);
        ctx.fillText(data.rightScore, offsetX + 0.75 * gameWidth, offsetY + fontSize);

    }, [canvasRef, drawButton, drawNet, username, goBackToMainMenu, goBackToSelectMode]);

    useEffect(() => {
        if (!socket) return;

        const handleGameDataUpdate = (data: any) => {
            setGameData(data);
            drawGame(data);

            if (data.isGameOver) {
                clearInterval(intervalId);
            }
        };

        socket.emit("attemptReconnect", { username: getCookie("username"), gameId });

        socket.on("updateGameData", handleGameDataUpdate);

        const intervalId = setInterval(() => {
            const currentKeys = activeKeysRef.current;
            if (currentKeys.length > 0) {
                socket.emit('playerActions', currentKeys);
                lastSentWasEmptyRef.current = false;
            } else if (!lastSentWasEmptyRef.current) {
                socket.emit('playerActions', []);
                lastSentWasEmptyRef.current = true;
            }
        }, 1000 / 60);

        return () => {
            clearInterval(intervalId);
            socket.off("updateGameData", handleGameDataUpdate);
        };
    }, [socket, gameId, drawGame]);

    useEffect(() => {
        const handleKeyDown = (event: any) => {

            console.log(`Key down: ${event.key}`);

            switch (event.key) {
                case "w":
                case "s":
                case "ArrowUp":
                case "ArrowDown":
                    if (!activeKeys.includes(event.key)) {
                        setActiveKeys(prevKeys => [...prevKeys, event.key]);
                    }
                    break;
                case "p":
                case "P":
                    if (isGamePaused) {
                        setGamePaused(false);
                        socket?.emit('resumeGame');
                    } else {
                        setGamePaused(true);
                        socket?.emit('pauseGame');
                    }
                    break;
                default:
                    break;
            }
        };

        const handleKeyUp = (event: any) => {

            console.log(`Key up: ${event.key}`);

            switch (event.key) {
                case "w":
                case "s":
                case "ArrowUp":
                case "ArrowDown":
                    setActiveKeys(prevKeys => prevKeys.filter(key => key !== event.key));
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [activeKeys, isGamePaused, socket]);

    const handleCanvasClick = useCallback((e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (let btn of buttons) {
            if (mouseX > btn.x && mouseX < btn.x + btn.width && mouseY > btn.y && mouseY < btn.y + btn.height) {
                console.log(`Clicked on button: ${btn.text}`);
                btn.callback();
                break;
            }
        }
    }, [buttons]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('click', handleCanvasClick);

        return () => {
            canvas.removeEventListener('click', handleCanvasClick);
        };
    }, [handleCanvasClick]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        function handleResize() {
            const navbar = document.querySelector('.navbar') as HTMLElement; // Type assertion
            const navbarHeight = navbar ? navbar.offsetHeight : 50;

            let containerWidth = window.innerWidth;
            let containerHeight = window.innerHeight - navbarHeight;

            let newCanvasWidth, newCanvasHeight;

            if (containerWidth <= 500 && containerHeight <= 440 - navbarHeight) {
                newCanvasWidth = 500;
                newCanvasHeight = 440;
            } else {
                if (containerWidth / containerHeight < TARGET_WIDTH / TARGET_HEIGHT) {
                    newCanvasHeight = Math.min(containerHeight, TARGET_HEIGHT);
                    newCanvasWidth = newCanvasHeight * (TARGET_WIDTH / TARGET_HEIGHT);
                } else {
                    newCanvasWidth = Math.min(containerWidth, TARGET_WIDTH);
                    newCanvasHeight = newCanvasWidth / (TARGET_WIDTH / TARGET_HEIGHT);
                }
            }

            // Ensure the canvas doesn't exceed the container's dimensions or its original size
            newCanvasWidth = Math.min(newCanvasWidth, TARGET_WIDTH, containerWidth);
            newCanvasHeight = Math.min(newCanvasHeight, TARGET_HEIGHT, containerHeight - navbarHeight);

            if (canvas) {
                canvas.width = newCanvasWidth;
                canvas.height = newCanvasHeight;
            }

            if (gameData) {
                drawGame(gameData);
            }
        }

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [gameData, drawGame]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            position: 'relative'
        }}>
            <canvas ref={canvasRef} style={{ backgroundColor: '#0d0d0e', position: 'absolute' }} />
        </div>
    );

}
export default SquareGame;
