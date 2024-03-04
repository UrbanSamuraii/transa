import {
    Injectable, Body, Res, Req, ForbiddenException,HttpException,
    UnauthorizedException, HttpStatus, HttpCode, InternalServerErrorException,
    Logger, UseFilters,
    NotFoundException,
} from "@nestjs/common";
import { PrismaClient, User } from '@prisma/client';
import { PrismaService } from "../prisma/prisma.service";
import * as argon from 'argon2'
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Response as ExpressResponse } from 'express';
import { UserService } from "src/user/user.service";
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { UserNotFoundException } from '../common/custom-exception/user-not-found-exception';
import { PrismaExceptionFilter } from "src/common/filters/prisma-exception.filter";
// import { pick } from 'lodash';
// import * as cookie from 'cookie'; // Import the cookie library

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private userService: UserService) { }
    
    private readonly logger = new Logger(AuthService.name);

    async signToken(userID: number, email: string): Promise<string> {
        const user = await this.userService.getUser({ email });
        const payload = {
            sub: userID,
            email,
            is_two_factor_activate: !!user.is_two_factor_activate,
            isTwoFactorAuthenticated: false,
        };
        const secret = this.config.get('JWT_2FA_SECRET');
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '5d',
            secret: secret,
        });
        return token;
    }

    async validateUser(email: string, pass: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email }
        });
        if (!user) {
            throw new ForbiddenException('Credentials incorrect: email');
        }
        const pwMatch = await argon.verify(user.hash, pass);
        if (!pwMatch) {
            throw new ForbiddenException('Credentials incorrect: password');
        }
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.hash;
        return userWithoutPassword;
    }

    async signup(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const hash = await argon.hash(req.body.password);
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: req.body.email,
                    username: req.body.username,
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    hash,
                },
            });
            const accessToken = await this.signToken(user.id, user.email);
            await this.prisma.user.update({
                where: { id: user.id },
                data: { accessToken: accessToken },
            });
            res.status(201).cookie('token', accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                expires: new Date(Date.now() + 5 * 24 * 60 * 1000),
            })
            return { success: true, message: 'User created successfully' };
        }
        catch (error: any) {
            // console.log(error)
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    if (Array.isArray(error.meta?.target)) {
                        if (error.meta.target.includes('email')) {
                            // console.log("ERRRRRRRRRRRRRROR");
                            // res.status(403).json({ error: 'Email already exists' });
                            throw new ForbiddenException('Error: Email already exists');
                        } else if (error.meta.target.includes('username')) {
                            // res.status(403).json({ error: 'Username already exists' });
                            throw new ForbiddenException('Error: Username already exists');
                        }
                    }
                }
            } // else {
                // res.status(500).json({ error: 'Internal server error' });
                // throw new InternalServerErrorException();
        }
    }

    async login(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const email = req.body.email;
        const user = await this.userService.getUser({ email });
        if (!user) {
            throw new ForbiddenException('Credentials incorrect: email');
        }
        const pwMatch = await argon.verify(user.hash, req.body.password);
        if (!pwMatch) {
            throw new ForbiddenException('Credentials incorrect: password');
        }
        else {
            if (user.is_two_factor_activate) {
                res.status(201).json({ user });
            }
            else {
                const newToken = await this.signToken(user.id, user.email);
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { accessToken: newToken },
                });
                res.status(200).cookie('token', newToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: 'lax',
                    expires: new Date(Date.now() + 5 * 24 * 60 * 1000),
                });
            }
        }
    }

    async loginWith2FA(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const email = req.body.email;
        const user = await this.userService.getUser({ email });
        const isCodeValid = this.isTwoFactorAuthenticationCodeValid(
            req.body.two_factor_athentication_password,
            user,
        );
        if (!isCodeValid) {
            throw new ForbiddenException('Wrong authentication code');
        }
        const newToken = await this.sign2FAToken(user.id, user.email);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { accessToken: newToken },
        });
        res.status(200).cookie('token', newToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            expires: new Date(Date.now() + 5 * 24 * 60 * 1000),
        })
    }

    ///////////////////// 2FA settings /////////////////////

    async sign2FAToken(userID: number, email: string): Promise<string> {
        const user = await this.userService.getUser({ email });
        const payload = {
            sub: userID,
            email,
            is_two_factor_activate: !!user.is_two_factor_activate,
            isTwoFactorAuthenticated: true,
        };
        const secret = this.config.get('JWT_2FA_SECRET');
        const token = await this.jwt.signAsync(payload, {
            expiresIn: '5d',
            secret: secret,
        });
        return token;
    }

    // Generate the "two_factor_secret" and Update our user in the database
    // Send back the secret and the otpAuthUrl
    async generateTwoFactorAuthenticationSecret(user: User) {
        const secret = authenticator.generateSecret();
        const otpAuthUrl = authenticator.keyuri(user.email, this.config.get<string>('AUTH_APP_NAME') as string, secret);
        await this.userService.setTwoFactorAuthenticationSecret(secret, user.id);
        return { secret, otpAuthUrl };
    }

    // Generate the Qr Code needed by our application
    async generateQrCodeDataURL(otpAuthUrl: string) {
        return toDataURL(otpAuthUrl);
    }

    // Method that will verify the authentication code with the user's secret
    isTwoFactorAuthenticationCodeValid(twoFactorAuthenticationCode: string, user: User) {
        return authenticator.verify({
            token: twoFactorAuthenticationCode,
            secret: user.two_factor_secret,
        });
    }

    // To add the turn on route in the authentication controller after our user scanned the qrCode
    // Here the user is using an SignToken (Not a Sign2FAToken) 
    // We are setting a 2FA token in the answer after a successfull authentication
    async turnOnTwoFactorAuthentication(@Req() req, @Res() res: ExpressResponse, user: User) {
        const isCodeValid = this.isTwoFactorAuthenticationCodeValid(
            req.body.twoFactorAuthenticationCode,
            user,
        );
        if (!isCodeValid) {
            console.log({ "CODE INVALIDE": req.body.twoFactorAuthenticationCode });
            throw new UnauthorizedException('Wrong authentication code');
        }
        const new2FAToken = await this.sign2FAToken(user.id, user.email);
        const new2FAUser = await this.userService.turnOnTwoFactorAuthentication(user.id, new2FAToken);
        res.clearCookie('token');
        return res.status(200).cookie('token', new2FAToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            expires: new Date(Date.now() + 5 * 24 * 60 * 1000),
        }).json({ new2FAUser });;
    }

    async turnOffTwoFactorAuthentication(@Req() req, @Res() res: ExpressResponse, user: User) {
        if (user.is_two_factor_activate == false) {
            return res.status(200).json({ user });
        }
        else {
            const newUser = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    is_two_factor_activate: false,
                    two_factor_secret: ''
                }
            });
            const newSimpleToken = await this.signToken(newUser.id, newUser.email);
            const newSimpleUser = await this.prisma.user.update({
                where: { id: user.id },
                data: { accessToken: newSimpleToken },
            });
            res.clearCookie('token');
            return res.status(200).cookie('token', newSimpleToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                expires: new Date(Date.now() + 5 * 24 * 60 * 1000),
            }).json({ newSimpleUser });;
        }
    }

    async forty2signup(@Req() req, @Res() res: ExpressResponse) {
        try {
            if (!req.user) { return res.status(401).json({ message: "Unauthorized" }); }

            const id42 = Number(req.user.id);
            const email = req.user.emails[0]?.value || '';
            const username = req.user.username;
            const first_name = req.user.name.givenName;
            const last_name = req.user.name.familyName;
            const img_url = req.user.photos[0]?.value || '';

            const existingUser = await this.userService.getUser({ email });

            if (!existingUser) {
                const user = await this.userService.createUser({
                    id42,
                    email,
                    username,
                    first_name,
                    last_name,
                    img_url,
                });
                const accessToken = await this.signToken(user.id, user.email);
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { accessToken: accessToken },
                });
                res.status(200).cookie('token', accessToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: 'lax',
                    expires: new Date(Date.now() + 5 * 24 * 60 * 1000),
                });
                const server_adress = process.env.SERVER_ADRESS;
                res.redirect(`http://${server_adress}:3000/`);
            }
            else {
                const user = await this.userService.getUser({ email });
                if (user.is_two_factor_activate == false) {
                    const accessToken = await this.signToken(user.id, user.email);
                    await this.prisma.user.update({
                        where: { id: user.id },
                        data: { accessToken: accessToken },
                    });
                    res.status(200).cookie('token', accessToken, {
                        httpOnly: true,
                        secure: false,
                        sameSite: 'lax',
                        expires: new Date(Date.now() + 5 * 24 * 60 * 1000),
                    });
                    const server_adress = process.env.SERVER_ADRESS;
                    res.redirect(`http://${server_adress}:3000/`);
                }
                else {
                    const server_adress = process.env.SERVER_ADRESS;
                    res.status(201).redirect(`http://${server_adress}:3000/FortyTwoFA?userEmail=${user.email}`);
                }
            }
        }
        catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Credentials taken');
                }
                throw error;
            }
        }
    }
}