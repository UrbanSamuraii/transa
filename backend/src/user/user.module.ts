import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';

@Global()
@Module({
    providers: [UserService, PrismaService],
    controllers: [UserController],
    exports: [UserService]
})

export class UserModule { }
