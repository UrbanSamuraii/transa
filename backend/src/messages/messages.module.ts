import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { UserService } from 'src/user/user.service';
import { MembersService } from 'src/members/members.service';
import { ConversationsService } from 'src/conversations/conversations.service';
import { GatewaySessionManager } from 'src/gateway/gateway.session';

@Global()
@Module({
	providers: [MessagesService, PrismaService, UserService, MembersService, ConversationsService, GatewaySessionManager],
    controllers: [MessagesController],
    exports: [MessagesService]
})

export class MessagesModule { }