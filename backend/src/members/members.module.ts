import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembersService } from './members.service';

@Global()
@Module({
    providers: [MembersService, PrismaService],
    exports: [MembersService]
})

export class MembersModule { }