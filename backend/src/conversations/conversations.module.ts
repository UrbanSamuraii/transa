import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { UserService } from 'src/user/user.service';
import { MembersService } from 'src/members/members.service';
import { GatewaySessionManager } from 'src/gateway/gateway.session';
// import { AdminStrategy } from 'src/auth/strategy';

@Global()
@Module({
	providers: [ConversationsService, PrismaService, UserService, MembersService, GatewaySessionManager],
    controllers: [ConversationsController],
    exports: [ConversationsService]
})

export class ConversationsModule { }