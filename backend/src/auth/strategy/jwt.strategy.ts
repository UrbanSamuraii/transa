import { Req, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport"
// import { Request } from "express";
import { Strategy, ExtractJwt } from "passport-jwt";
import { UserService } from "src/user/user.service";
import { AuthService } from "../auth.service";
import { PrismaService } from "../../prisma/prisma.service";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') 
{
	constructor (private config: ConfigService, 
		private userService: UserService,
		private readonly prisma: PrismaService,
		private authService: AuthService) {
		
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				JwtStrategy.extractJWTFromCookie,
				ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback to header if cookie doesn't contain token
			  ]),
			secretOrKey: config.get('JWT_2FA_SECRET'),
		  });
	}

	private static extractJWTFromCookie(@Req() req) {
		if (req.cookies) {
			return req.cookies.token;
		}
		return null;
	}	

	async validate(@Req() req, payload: any) {
		return payload;
    }
}