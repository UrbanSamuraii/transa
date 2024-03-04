import { OnModuleInit } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, OnGatewayInit, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SquareGameService } from './game.square.service';
import { PowerPongGameService } from './game.power.pong.service';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { PrismaService } from "src/prisma/prisma.service";
import { v4 as uuidv4 } from 'uuid';
import { Prisma, User, Game } from '@prisma/client';
import { GatewaySessionManager } from "../gateway/gateway.session";

const server_adress = process.env.SERVER_ADRESS;


enum PowerType {
    Expand = 'Expand',
    SpeedBoost = 'SpeedBoost',
    MultiBall = 'MultiBall',
}

interface Power {
    type: PowerType;
    duration: number; // in milliseconds
}

export interface PlayerInfo {
    username: string;
    score: number;
    activeKeys: string[];
    currentElo: number;
    potentialEloGain: number;
    potentialEloLoss: number;
    selectedPower: Power | null;
    powerBarLevel: number;
    lastPowerActivation: number;
}

@WebSocketGateway({
    cors: {
        origin: [`http://${server_adress}:3000`, "*"],
        methods: ["GET", "POST"],
        credentials: true,
    },
})
export class GameGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;
    private queue: { socket: Socket, gameMode: string }[] = [];
    private playerInfoMap = new Map<number, Map<string, PlayerInfo>>();
    private gameLoop: NodeJS.Timeout;
    private userInGameMap = new Map<string, boolean>();
    private userCurrentGameMap = new Map<string, { gameId: number, gameMode: string }>();

    constructor(private classicGameService: SquareGameService,
        private PowerPongGameService: PowerPongGameService,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private prisma: PrismaService,
        private readonly sessions: GatewaySessionManager

    ) { }

    private removeFromQueue(clientToRemove: Socket) {
        console.log("Queue before removal:", this.queue.map(client => client.socket.id));
        this.queue = this.queue.filter(client => client.socket !== clientToRemove);
        console.log("Queue after removal:", this.queue.map(client => client.socket.id));
    }

    afterInit(server: Server) {
        // console.log("Socket.io initialized");
    }

    async calculateEloRatings(winnerId: number, loserId: number) {
        const kFactor = 32; // K-factor determines the sensitivity of ELO rating changes
        const winnerRating = await this.userService.getEloRating(winnerId);
        const loserRating = await this.userService.getEloRating(loserId);

        const expectedWinnerScore = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
        const expectedLoserScore = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

        const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinnerScore));
        const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoserScore));

        return { newWinnerRating, newLoserRating };
    }

    async calculatePotentialEloChanges(player1Id: number, player2Id: number) {
        const kFactor = 32;
        const player1Rating = await this.userService.getEloRating(player1Id);
        const player2Rating = await this.userService.getEloRating(player2Id);

        // Calculate expected scores
        const expectedScorePlayer1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
        const expectedScorePlayer2 = 1 / (1 + Math.pow(10, (player1Rating - player2Rating) / 400));

        // Calculate potential ELO gains and losses
        const potentialGainPlayer1 = Math.round(kFactor * (1 - expectedScorePlayer1));
        const potentialLossPlayer1 = Math.round(kFactor * (0 - expectedScorePlayer1));
        const potentialGainPlayer2 = Math.round(kFactor * (1 - expectedScorePlayer2));
        const potentialLossPlayer2 = Math.round(kFactor * (0 - expectedScorePlayer2));

        return {
            player1: { potentialEloGain: potentialGainPlayer1, potentialEloLoss: potentialLossPlayer1 },
            player2: { potentialEloGain: potentialGainPlayer2, potentialEloLoss: potentialLossPlayer2 }
        };
    }

    private async handleGameOver(winnerUsername: string, loserUsername: string, gameId: number): Promise<void> {
        try {
            const winnerId = await this.userService.getUserIdByUsername(winnerUsername);
            const loserId = await this.userService.getUserIdByUsername(loserUsername);

            if (winnerId && loserId) {
                // Increment win/loss counts
                await this.userService.incrementGamesWon(winnerId);
                await this.userService.incrementGamesLost(loserId);

                // Get current ELO ratings
                const winnerRating = await this.userService.getEloRating(winnerId);
                const loserRating = await this.userService.getEloRating(loserId);

                // Calculate new ELO ratings and changes
                const eloRatings = await this.calculateEloRatings(winnerId, loserId);
                const { newWinnerRating, newLoserRating } = eloRatings;

                const eloChangeWinner = newWinnerRating - winnerRating;
                const eloChangeLoser = newLoserRating - loserRating;

                // Update ELO ratings
                await this.userService.updateEloRating(winnerId, newWinnerRating);
                await this.userService.updateEloRating(loserId, newLoserRating);

                await this.prisma.game.update({
                    where: { id: gameId },
                    data: {
                        winnerId: winnerId,
                        loserId: loserId,
                        eloChangeWinner: eloChangeWinner,
                        eloChangeLoser: eloChangeLoser
                    }
                });

                this.server.to(gameId.toString()).emit('gameOver', { winnerUsername });
            }
        } catch (error) {
            console.error('Error in handleGameOver:', error);
        }
    }

    async handleConnection(client: Socket, ...args: any[]) {
        client.on('disconnect', (reason) => {
            console.log('Client disconnected:', 'Reason:', reason);
        });
    }

    @SubscribeMessage('leaveMatchmaking')
    handleLeaveMatchmaking(client: Socket) {
        console.log("handleLeaveMatchmaking");
        this.removeFromQueue(client);
        if (client.data?.user?.username) {
            this.playerInfoMap.delete(client.data.user.username);
            console.log(`Removed ${client.data.user.username} from playerInfoMap`);
        }
    }

    private async verifyTokenAndGetUserInfo(client: Socket): Promise<User | null> {
        const token = client.handshake.headers.cookie?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
        if (!token) {
            console.log('No token provided from enterMatchmaking');
            return null;
        }

        try {
            const decoded = this.jwtService.verify(token);
            const userInfo = await this.userService.getUserByToken(token);
            return userInfo;
        } catch (e) {
            console.log('Invalid token', e);
            return null;
        }
    }

    private isUserInQueue(username: string): boolean {
        return this.queue.some(client => client.socket.data.user.username === username);
    }

    private async addUserToQueue(client: { socket: Socket, gameMode: string }, userInfo: User): Promise<void> {
        client.socket.data.user = userInfo;

        if (this.userInGameMap.get(userInfo.username)) {
            console.log('User is already in a game, user:', userInfo.username);
            return;
        }
        this.queue.push(client);

        let currentElo;

        try {
            // Attempt to fetch the current ELO rating
            currentElo = await this.userService.getEloRating(userInfo.id);
        } catch (error) {
            console.error(`Error fetching ELO rating for user ${userInfo.username}:`, error);
            // Set a default ELO rating
            currentElo = 1000;
        }

        const playerInfo: PlayerInfo = {
            username: userInfo.username,
            score: 0,
            activeKeys: [],
            currentElo: currentElo,
            potentialEloGain: 0,
            potentialEloLoss: 0,
            selectedPower: null,
            powerBarLevel: 0,
            lastPowerActivation: Date.now()
        };

        client.socket.data.playerInfo = playerInfo;
    }

    private resetUserGameStatus(username: string): void {
        this.userInGameMap.set(username, false);
    }

    private async startMatchmaking(): Promise<void> {
        while (this.queue.length >= 2) {
            // Find two players with the same game mode
            const index = this.findMatchingPlayerIndex();
            if (index === -1) break;

            const player1 = this.queue.splice(index, 1)[0];
            const player2 = this.queue.shift();

            if (!player1 || !player2) continue;

            this.userInGameMap.set(player1.socket.data.user.username, true);
            this.userInGameMap.set(player2.socket.data.user.username, true);

            const gameMode = player1.gameMode;

            const newGame = await this.createGame(player1.socket, player2.socket, gameMode);
            const gameService = gameMode === 'powerpong' ? this.PowerPongGameService : this.classicGameService;

            const gameId = newGame.id;

            const eloChanges = await this.calculatePotentialEloChanges(player1.socket.data.user.id, player2.socket.data.user.id);

            // Update playerInfo with ELO changes
            const updatedPlayer1Info = { ...player1.socket.data.playerInfo, ...eloChanges.player1 };
            const updatedPlayer2Info = { ...player2.socket.data.playerInfo, ...eloChanges.player2 };

            const gamePlayerInfoMap = new Map<string, PlayerInfo>();
            gamePlayerInfoMap.set(player1.socket.data.user.username, updatedPlayer1Info);
            gamePlayerInfoMap.set(player2.socket.data.user.username, updatedPlayer2Info);

            this.playerInfoMap.set(gameId, gamePlayerInfoMap);

            player1.socket.join(gameId.toString());
            player2.socket.join(gameId.toString());
            console.log('%s player1 has joined %s room', player1.socket.data.user.username, gameId.toString())
            console.log('%s player2 has joined %s room', player2.socket.data.user.username, gameId.toString())

            player1.socket.emit('matchFound', { opponent: player2.socket.data.user, gameId, gameMode: player1.gameMode });
            player2.socket.emit('matchFound', { opponent: player1.socket.data.user, gameId, gameMode: player1.gameMode });

            gameService.updateGameState(gameId, this.playerInfoMap.get(gameId), (data) => {
                this.server.to(gameId.toString()).emit('updateGameData', {
                    ...data,
                });

                if (data.isGameOver && data.winnerUsername && data.loserUsername) {
                    this.resetUserGameStatus(player1.socket.data.user.username);
                    this.resetUserGameStatus(player2.socket.data.user.username);
                    player1.socket.leave(gameId.toString());
                    player2.socket.leave(gameId.toString());
                    this.playerInfoMap.delete(player1.socket.data.user.username);
                    this.playerInfoMap.delete(player2.socket.data.user.username);
                    this.userCurrentGameMap.delete(player1.socket.data.user.username);
                    this.userCurrentGameMap.delete(player2.socket.data.user.username);
                    this.handleGameOver(data.winnerUsername, data.loserUsername, gameId).catch((error) => {
                        console.error('Error handling game over:', error);
                    });
                }
            });

            console.log(`Matched ${player1.socket.data.user.username} with ${player2.socket.data.user.username}`);
        }
    }

    private async createDirectGame(player1Socket: Socket, player2Socket: Socket, gameMode) {
        if (!player1Socket || !player2Socket) return;

        // Mark players as in a game to prevent re-queueing or duplicate game sessions
        this.userInGameMap.set(player1Socket.data.user.username, true);
        this.userInGameMap.set(player2Socket.data.user.username, true);

        // Create the game session
        const newGame = await this.createGame(player1Socket, player2Socket, gameMode);
        const gameId = newGame.id;
        const gameService = gameMode === 'powerpong' ? this.PowerPongGameService : this.classicGameService;
        const gamePageURL = `/classic/${gameId}`; // Construct the URL to navigate to

        const eloChanges = await this.calculatePotentialEloChanges(player1Socket.data.user.id, player2Socket.data.user.id);

        const updatedPlayer1Info = { ...player1Socket.data.playerInfo, ...eloChanges.player1 };
        const updatedPlayer2Info = { ...player2Socket.data.playerInfo, ...eloChanges.player2 };

        const gamePlayerInfoMap = new Map<string, PlayerInfo>();
        gamePlayerInfoMap.set(player1Socket.data.user.username, updatedPlayer1Info);
        gamePlayerInfoMap.set(player2Socket.data.user.username, updatedPlayer2Info);

        // Save the game state
        this.playerInfoMap.set(gameId, gamePlayerInfoMap);

        // Notify players to join the game room
        await player1Socket.join(gameId.toString());
        await player2Socket.join(gameId.toString());
        console.log(`${player1Socket.data.user.username} and ${player2Socket.data.user.username} have joined game room ${gameId}`);

        // Start the game
        player1Socket.emit('navigateToGame', { url: gamePageURL });
        player2Socket.emit('navigateToGame', { url: gamePageURL });
        this.server.to(gameId.toString()).emit('have you joined the room')

        gameService.updateGameState(gameId, this.playerInfoMap.get(gameId), (data) => {
            this.server.to(gameId.toString()).emit('updateGameData', {
                ...data,
            });

            if (data.isGameOver && data.winnerUsername && data.loserUsername) {
                this.resetUserGameStatus(player1Socket.data.user.username);
                this.resetUserGameStatus(player2Socket.data.user.username);
                player1Socket.leave(gameId.toString());
                player2Socket.leave(gameId.toString());
                this.playerInfoMap.delete(player1Socket.data.user.username);
                this.playerInfoMap.delete(player2Socket.data.user.username);
                this.userCurrentGameMap.delete(player1Socket.data.user.username);
                this.userCurrentGameMap.delete(player2Socket.data.user.username);
                this.handleGameOver(data.winnerUsername, data.loserUsername, gameId).catch((error) => {
                    console.error('Error handling game over:', error);
                });
            }
        });

    }

    private findMatchingPlayerIndex(): number {
        for (let i = 1; i < this.queue.length; i++) {
            if (this.queue[0].gameMode === this.queue[i].gameMode) {
                return i;
            }
        }
        return -1;
    }

    private async createGame(player1: Socket, player2: Socket, gameMode: string): Promise<Game> {
        const newGame = await this.prisma.game.create({
            data: {
                uniqueId: uuidv4(),
                player1Id: player1.data.user.id,
                player2Id: player2.data.user.id,
                gameMode: gameMode,
            }
        });

        this.userCurrentGameMap.set(player1.data.user.username, {
            gameId: newGame.id,
            gameMode: gameMode,
        });
        this.userCurrentGameMap.set(player2.data.user.username, {
            gameId: newGame.id,
            gameMode: gameMode,
        });
        return newGame;
    }

    @SubscribeMessage('enterMatchmaking')
    async handleEnterMatchmaking(client: Socket, payload: { gameMode: string }) {

        const userInfo = await this.verifyTokenAndGetUserInfo(client);
        if (!userInfo) {
            client.disconnect(true);
            return;
        }

        if (this.isUserInQueue(userInfo.username)) {
            console.log('User already in queue');
            return;
        }

        this.addUserToQueue({ socket: client, gameMode: payload.gameMode }, userInfo);

        if (this.queue.length >= 2) {
            this.startMatchmaking();
        }
    }

    @SubscribeMessage('gameInviteResponse')
    async handleGameInviteResponse(client: Socket, { accepted, targetUsername, senderUsername }: { accepted: boolean; targetUsername: string; senderUsername: string; }) {
        if (!accepted) {
            // Optionally, notify the inviter that the invite was declined
            return;
        }

        // console.log(targetUsername)
        // console.log(senderUsername)
        const inviteeId = await this.userService.getUserIdByUsername(senderUsername);
        const inviterId = await this.userService.getUserIdByUsername(targetUsername);
        // console.log(`inviteeId: ${inviteeId}`)
        // console.log(`inviterId: ${inviterId}`)
        const inviterSocket = await this.sessions.getUserSocket(inviterId);
        const inviteeSocket = await this.sessions.getUserSocket(inviteeId);

        const userInfo1 = await this.verifyTokenAndGetUserInfo(inviterSocket);
        const userInfo2 = await this.verifyTokenAndGetUserInfo(inviteeSocket);
        if (!userInfo2 || !userInfo1) {
            client.disconnect(true);
            return;
        }

        inviterSocket.data.user = userInfo1
        inviteeSocket.data.user = userInfo2
        // console.log(`inviterSocket.data.user.username: ${inviterSocket.data.user.username}`)
        // console.log(`inviteeSocket.data.user.username: ${inviteeSocket.data.user.username}`)
        // console.log(`userInfo1 : ${userInfo1}`)
        // console.log(`userInfo2 : ${userInfo2}`)
        if (!inviterSocket || !inviteeSocket) {
            console.error("Error: One of the users is not connected.");
            return;
        }

        const gameMode = 'classic';

        let inviterCurrentElo;
        let inviteeCurrentElo;

        try {
            inviterCurrentElo = await this.userService.getEloRating(inviterId);
            inviteeCurrentElo = await this.userService.getEloRating(inviteeId);
        } catch (error) {
            console.error(`Error fetching ELO rating for users ${targetUsername} and ${senderUsername}:`, error);
            inviterCurrentElo = 1000;
            inviteeCurrentElo = 1000;
        }

        const inviterPlayerInfo: PlayerInfo = {
            username: targetUsername,
            score: 0,
            activeKeys: [],
            currentElo: inviterCurrentElo,
            potentialEloGain: 0,
            potentialEloLoss: 0,
            selectedPower: null,
            powerBarLevel: 0,
            lastPowerActivation: Date.now()
        };

        const inviteePlayerInfo: PlayerInfo = {
            username: senderUsername,
            score: 0,
            activeKeys: [],
            currentElo: inviteeCurrentElo,
            potentialEloGain: 0,
            potentialEloLoss: 0,
            selectedPower: null,
            powerBarLevel: 0,
            lastPowerActivation: Date.now()
        };

        inviterSocket.data.playerInfo = inviterPlayerInfo;
        inviteeSocket.data.playerInfo = inviteePlayerInfo;
        // console.log(`inviterSocket username: ${inviterSocket.data.user.username}`)
        // console.log(`inviteeSocket username: ${inviteeSocket.data.user.username}`)
        // Proceed to create the game directly without queueing
        await this.createDirectGame(inviterSocket, inviteeSocket, gameMode);
    }



    @SubscribeMessage('playerActions')
    handlePlayerActions(client: Socket, activeKeys: string[]) {

        if (!client.data || !client.data.user) {
            console.error('User data is not available in handlePlayerActions');
            return;
        }

        const playerUsername = client.data.user.username;

        if (!playerUsername) {
            console.error('Player username is not available in handlePlayerActions');
            return;
        }

        const userGameInfo = this.userCurrentGameMap.get(playerUsername);
        if (userGameInfo == null) {
            console.error(`userGameInfo not found for username: ${playerUsername}`);
            return;
        }
        const gameId = userGameInfo.gameId || null;
        if (gameId === null || gameId === undefined) {
            console.error(`Game ID not found for username: ${playerUsername}`);
            return;
        }
        const gamePlayerInfoMap = this.playerInfoMap.get(gameId);
        if (!gamePlayerInfoMap) {
            console.error(`Player info map not found for game ID: ${gameId}`);
            return;
        }

        const playerInfo = gamePlayerInfoMap.get(playerUsername);
        if (!playerInfo) {
            console.error(`Player info not found for username: ${playerUsername} in game ID: ${gameId}`);
            return;
        } else {
            playerInfo.activeKeys = activeKeys;
        }
    }

    @SubscribeMessage('checkGameStatus')
    async handleCheckGameStatus(client: Socket): Promise<void> {
        const userInfo = await this.verifyTokenAndGetUserInfo(client);
        if (!userInfo) {
            client.emit('gameStatusResponse', { inGame: false });
            return;
        }
        const userGameData = this.userCurrentGameMap.get(userInfo.username);
        const inGame = !!userGameData;
        const gameId = inGame ? userGameData.gameId : null;
        const gameMode = inGame ? userGameData.gameMode : null;

        client.emit('gameStatusResponse', { inGame, gameId, gameMode });
    }

    @SubscribeMessage('attemptReconnect')
    async handleAttemptReconnect(client: Socket, payload: { username: string; gameId: string }): Promise<void> {
        const userInfo = await this.verifyTokenAndGetUserInfo(client);
        if (!userInfo) {
            console.error('User verification failed on reconnect');
            return;
        }
        client.data.user = userInfo;
        client.join(payload.gameId.toString());
    }
}