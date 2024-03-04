import { Module, UseGuards } from "@nestjs/common";
import { MessagingGateway } from "./websocket.gateway";
import { GatewaySessionManager } from "./gateway.session";
import { UserModule } from "../user/user.module";
import { MembersModule } from "../members/members.module";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
    imports: [UserModule, MembersModule],
    providers: [PrismaService, MessagingGateway, {
        provide: GatewaySessionManager,
        useClass: GatewaySessionManager
    }],
    exports: [GatewaySessionManager]
})

export class GatewayModule { }
