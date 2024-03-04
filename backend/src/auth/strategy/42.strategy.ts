import { Injectable } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-42';
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";
const server_adress = process.env.SERVER_ADRESS;

@Injectable()
export class Auth42Strategy extends PassportStrategy(Strategy, '42')
{

    constructor(private config: ConfigService, private authService: AuthService) {
        super({
            clientID: config.get('UID_42_API'),
            clientSecret: config.get('SECRET_42_API'),
            callbackURL: `http://${server_adress}:3000/auth/sign42`,
            scope: 'public',
        })
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        return done(null, profile);
    }
}
