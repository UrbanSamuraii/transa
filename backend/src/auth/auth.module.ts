import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy";
import { Jwt2faStrategy } from "./strategy";
import { Auth42Strategy } from "./strategy";
import { LocalStrategy } from "./strategy";
// import { AdminStrategy } from "./strategy";
import { UserService } from "src/user/user.service";
import passport from "passport";
import { PassportModule } from "@nestjs/passport";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt', session: false }),
        PassportModule.register({ defaultStrategy: 'jwt-2fa', session: false }),
        PassportModule.register({ defaultStrategy: '42', session: false }),
        // PassportModule.register({ defaultStrategy: 'admin', session: false }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '5d' },
        })],
    controllers: [AuthController],
    providers: [AuthService, PrismaService, JwtStrategy, Auth42Strategy, Jwt2faStrategy, LocalStrategy],
    exports: [JwtModule],
})

export class AuthModule { }
