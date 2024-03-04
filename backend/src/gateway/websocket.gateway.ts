import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection } from "@nestjs/websockets";
import { Response as ExpressResponse } from 'express';
import { Res, Req, Next } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "src/prisma/prisma.service";
import { UserService } from "src/user/user.service";
import { MembersService } from "src/members/members.service";
import { ConversationsService } from "src/conversations/conversations.service";
import { GatewaySessionManager } from "./gateway.session";
import { AuthenticatedSocket } from "../utils/interfaces";
const server_adress = process.env.SERVER_ADRESS;
import { Prisma, User } from "@prisma/client";

@WebSocketGateway({
    cors: {
        origin: [`http://${server_adress}:3000`, "*"],
        methods: ["GET", "POST", "DELETE"],
        credentials: true,
    }
})


export class MessagingGateway implements OnGatewayConnection {

    constructor(private readonly userService: UserService,
        private readonly memberService: MembersService,
        private readonly sessions: GatewaySessionManager,
        private readonly prisma: PrismaService,
        private readonly convService: ConversationsService) { }

    private readonly pingInterval = 10000; // 5 seconds
    private readonly pongTimeout = 5000; // 3 seconds

    async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
        console.log("New incoming connection !");
        const cookie = client.handshake.headers.cookie;
        const token = cookie?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];

        if (token) {
            const identifiedUser = await this.userService.getUserByToken(token);
            if (identifiedUser) {
                client = this.associateUserToAuthSocket(client, identifiedUser);
                this.sessions.setUserSocket(identifiedUser.id, client);

                // start to PING my user
                this.startPingRoutine(client);
                // To make my userSocket join all the room the user is member of
                const userWithConversations = await this.memberService.getMemberWithConversationsHeIsMemberOf(identifiedUser);
                for (const conversation of userWithConversations.conversations) {
                    client.join(conversation.id.toString());
                }
            }
        }

        console.log({ "SOCKET id of our user": client.id });
        client.emit('connected', { status: 'GOOD CONNEXION ESTABLISHED' }); // ?? Usefull ??

        return;
    }

    private startPingRoutine(client: AuthenticatedSocket) {

        const pingRoutine = () => {
            this.pingClient(client);

            const pongTimeoutId = setTimeout(() => {
                // console.log(`Pong not received from user ${client.user?.id} within timeout`);
                this.handlePongTimeout(client);
                // console.log("Client offline");
            }, this.pongTimeout);

            // Listen for pong from the client

            client.once('pong', async () => {
                // console.log(`Received pong from user ${client.user?.id}`);
                clearTimeout(pongTimeoutId);
                this.handlePongInTime(client);
                // console.log("Client online");
                await this.sleep(this.pingInterval);
                pingRoutine();
            });
        };

        pingRoutine();
    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    pingClient(client: AuthenticatedSocket) {
        this.server.to(client.id.toString()).emit('ping');
    }

    async handlePongInTime(client: AuthenticatedSocket) {
        const user = client.user;
        await this.prisma.user.update({
            where: { id: user.id },
            data: { status: 'ONLINE' },
        });
        const friendsList = await this.userService.getUserFriendsList(user.id)
        for (const friend of friendsList) {
            const friendSocket = this.sessions.getUserSocket(friend.id);
            if (friendSocket) {
                this.server.to(client.id.toString()).emit('changeInFriendship');
                this.server.to(friendSocket.id.toString()).emit('changeInFriendship');
            }
        }
    }

    async handlePongTimeout(client: AuthenticatedSocket) {
        const user = client.user;
        await this.prisma.user.update({
            where: { id: user.id },
            data: { status: 'OFFLINE' },
        });
        const friendsList = await this.userService.getUserFriendsList(user.id)
        for (const friend of friendsList) {
            const friendSocket = this.sessions.getUserSocket(friend.id);
            if (friendSocket) {
                this.server.to(friendSocket.id.toString()).emit('changeInFriendship');
                // this.server.to(client.id.toString()).emit('changeInFriendship');
            }
        }
    }

    ////////////////////// PRIVATE METHODE //////////////////////

    private associateUserToAuthSocket(socket: AuthenticatedSocket, identifiedUser: User): AuthenticatedSocket {
        socket.user = identifiedUser;
        return socket;
    }

    private extractUserIdFromSocket(socket: AuthenticatedSocket): Number | null {
        const userId = socket.user.id;
        return userId ? userId : null;
    }

    //////////////////////////////////////////////////////////////

    // To inject the WebSocket server instance provided by socket.io
    @WebSocketServer() server: Server;

    @OnEvent('join.room')
    async joinSpecificConversation(user: User, conversationId: number) {
        const userSocket = this.sessions.getUserSocket(user.id);
        userSocket.join(conversationId.toString());
        console.log({ "User socket connected to the room !": userSocket.id });
        this.server.to(userSocket.id.toString()).emit('onJoinRoom', user, conversationId);
        this.server.to(conversationId.toString()).emit('changeInConversation');
    }

    @OnEvent('message.create')
    async handleMessageCreatedEvent(payload: any) {
        if (payload.newMessage.author) {
            const isMute = await this.memberService.isMuteMember(payload.newMessage.conversation_id, payload.newMessage.author.id);
            if (!isMute) {
                const authorSocket = await this.sessions.getUserSocket(payload.user.id);
                this.server.to(authorSocket.id.toString()).emit('onMessage', payload.newMessage);
                this.server.to(authorSocket.id.toString()).emit('onNewMessage');
                const conversationOtherMembers = await this.convService.getConversationOtherMembers(payload.newMessage.conversation_id, payload.user.id);
                for (const member of conversationOtherMembers) {
                    const isBlocked = await this.convService.isBlockedByUser(payload.user, member);
                    if (isBlocked == false) {
                        const memberSocket = await this.sessions.getUserSocket(member.id);
                        if (memberSocket !== undefined) {
                            this.server.to(memberSocket.id.toString()).emit('onMessage', payload.newMessage);
                        }
                        this.server.to(memberSocket.id.toString()).emit('onNewMessage');
                    }
                }
            }
        } else {
            this.server.emit('onMessage', payload); // WHEN CREATING THE CONVERSATION -
        }
    }
    @OnEvent('message.deleted')
    handleMessageDeletedEvent(payload: any) {
        if (payload.author) {
            this.server.to(payload.conversation_id.toString()).emit('onDeleteMessage', payload);
        }
        else { this.server.emit('onDeleteMessage', payload); }
    }

    @OnEvent('last.message.deleted')
    handleLastMessageDeletedEvent(payload: any) {
        if (payload.author) {
            this.server.to(payload.conversation_id.toString()).emit('onDeleteLastMessage', payload);
        }
        else { this.server.emit('onDeleteLastMessage', payload); }
    }

    @OnEvent('change.privacy')
    displayChangeOfPrivacyEvent(payload: any) {
        console.log("The server has detect a change in privacy room number :", payload);
        this.server.to(payload.conversationId).emit('onChangePrivacy', payload);
        this.server.to(payload.conversationId).emit('changeInConversation');
    }

    @OnEvent('admin.status.member')
    async displayChangeOfStatusMemberEvent(payload: any) {
        console.log("The server has detect a change in status of member :", payload.member);
        const memberId = payload.member.id;
        const memberSocket = await this.sessions.getUserSocket(memberId);
        if (memberSocket) {
            this.server.to(memberSocket.id.toString()).emit('onAdminStatusMember', payload);
        }
    }

    @OnEvent('admin.status.update')
    async displayUpdateStatusMemberEvent(payload: any) {
        const user = await this.userService.getUserByEmail(payload.user.email);
        const memberSocket = await this.sessions.getUserSocket(user.id);
        this.server.to(memberSocket.id.toString()).emit('onUpdateAdminStatus');
    }

    @OnEvent('admin.status.downgrade')
    async displayDowngradeStatusMemberEvent(payload: any) {
        const user = await this.userService.getUserByEmail(payload.user.email);
        const memberSocket = await this.sessions.getUserSocket(user.id);
        this.server.to(memberSocket.id.toString()).emit('onDowngradeAdminStatus');
    }

    @OnEvent('change.password')
    displayChangeOfPasswordEvent(payload: any) {
        console.log("The server has detect a change in password of room number :", payload);
        this.server.to(payload.conversationId).emit('onChangePassword', payload);
        this.server.to(payload.conversationId).emit('changeInConversation');
    }

    @OnEvent('remove.member')
    async alertRemoveMember(payload: any) {
        console.log("The server is alerting that a member left the room", payload.conversationId);
        const removedMemberSocket = await this.sessions.getUserSocket(payload.member.id);
        if (removedMemberSocket) {
            removedMemberSocket.leave(payload.conversationId.toString());
            this.server.to(removedMemberSocket.id.toString()).emit('onRemovedMember', payload);
            this.server.to(payload.conversationId).emit('changeInConversation');
        };
    }

    @OnEvent('block.user')
    async blockUser(payload: any) {
        const userSocket = await this.sessions.getUserSocket(payload.user.id);
        const targetSocket = await this.sessions.getUserSocket(payload.target.id);
        this.server.to(userSocket.id.toString()).emit('onBeingBlockedorBlocked', payload);
        if (targetSocket) { this.server.to(targetSocket.id.toString()).emit('onBeingBlockedorBlocked', payload); };
    }

    @OnEvent('unblock.user')
    async unblockUser(payload: any) {
        const userSocket = await this.sessions.getUserSocket(payload.user.id);
        const targetSocket = await this.sessions.getUserSocket(payload.target.id);
        this.server.to(userSocket.id.toString()).emit('onBeingUnblockedorUnblocked', payload);
        if (targetSocket) { this.server.to(targetSocket.id.toString()).emit('onBeingUnblockedorUnblocked', payload); };
    }

    @OnEvent('mute.member')
    async muteMember(payload: any) {
        const user = await this.userService.getUserByEmail(payload.user.email);
        const userSocket = await this.sessions.getUserSocket(user.id);
        this.server.to(userSocket.id.toString()).emit('onMuteMember');
    }

    @OnEvent('unmute.member')
    async unmuteMember(payload: any) {
        const user = await this.userService.getUserByEmail(payload.user.email);
        const userSocket = await this.sessions.getUserSocket(user.id);
        this.server.to(userSocket.id.toString()).emit('onUnmuteMember');
    }

    @OnEvent('unban.user')
    async unbanUserEvent(payload: any) {
        const user = await this.userService.getUserByEmail(payload.user.email);
        const userSocket = await this.sessions.getUserSocket(user.id);
        this.server.to(userSocket.id.toString()).emit('onUnbanUser');
    }

    @OnEvent('signout')
    async signoutApp(payload: any) {
        const user = await this.userService.getUserById(payload.id);
        const userSocket = await this.sessions.getUserSocket(user.id);
        this.server.to(userSocket.id.toString()).emit('signout');
    }

    @OnEvent('friend')
    async changeInFriendRelations(payload: any) {
        const user = await this.userService.getUserById(payload.userId);
        const target = await this.userService.getUserById(payload.targetId);
        const userSocket = await this.sessions.getUserSocket(user.id);
        const targetSocket = await this.sessions.getUserSocket(target.id);
        this.server.to(userSocket.id.toString()).emit('changeInFriendship');
        this.server.to(targetSocket.id.toString()).emit('changeInFriendship');
    }

    @OnEvent('invite_game')
    async inviteGame(payload: any) {
        const user = await this.userService.getUserById(payload.userId);
        const target = await this.userService.getUserById(payload.targetId);
        const userSocket = await this.sessions.getUserSocket(user.id);
        const targetSocket = await this.sessions.getUserSocket(target.id);
        if (userSocket && targetSocket)
            this.server.to(targetSocket.id.toString()).emit('inviteGame', {
                message: 'You have been invited to a game!',
                target: user.username,
            });
        else
            console.log("socket error in invite game")
    }

}
