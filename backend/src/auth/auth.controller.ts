import {
    Controller, Get, UseGuards, Req, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus,
    Res, Request, Param
} from '@nestjs/common';
import { AuthService } from "./auth.service";
import { Jwt2faAuthGuard } from 'src/auth/guard';
import { FortyTwoAuthGuard } from 'src/auth/guard';
import { Response as ExpressResponse } from 'express';
import { UserService } from "src/user/user.service";
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { imageFileFilter } from '../utils/file-upload.utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from "src/prisma/prisma.service";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService,
        private eventEmitter: EventEmitter2,
        private userService: UserService,
        private prisma: PrismaService // Inject Prisma service here
    ) { }

    @UseGuards(FortyTwoAuthGuard)
    @Get('signup42')
    async FortyTwoLogin() { }

    @UseGuards(FortyTwoAuthGuard)
    @Get('sign42')
    async FortyTwoRedirect(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        return (await this.authService.forty2signup(req, res));
    }

    @Post('signup')
    async signup(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        return (await this.authService.signup(req, res));
    }

    @Post('login')
    async login(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        return (await this.authService.login(req, res));
    }

    @Post('2fa/login')
    async loginWith2FA(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        return (await this.authService.loginWith2FA(req, res));
    }

    @UseGuards(Jwt2faAuthGuard)
    @Get('signout')
    async signout(@Req() req, @Res() res: ExpressResponse) {
        try {
            const user = await this.userService.getUserByToken(req.cookies.token);
            this.eventEmitter.emit('signout', user);
            res.clearCookie('token');
            return res.status(200).json({ message: 'Logout successful' });

        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    @UseGuards(Jwt2faAuthGuard)
    @Post('2fa/generate')
    async register(@Req() req, @Res() res: ExpressResponse) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const { secret, otpAuthUrl } = await this.authService.generateTwoFactorAuthenticationSecret(user);
        const userUpdated = await this.userService.getUserByToken(req.cookies.token);
        return res.status(200).json({
            user, // Include the updated user object in the response
            qrCodeUrl: await this.authService.generateQrCodeDataURL(otpAuthUrl)
        });
    }

    @UseGuards(Jwt2faAuthGuard)
    @Post('2fa/turn_on')
    async turnOnTwoFactorAuthentication(@Req() req, @Res() res: ExpressResponse) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        return (await this.authService.turnOnTwoFactorAuthentication(req, res, user));
    }

    @UseGuards(Jwt2faAuthGuard)
    @Post("2fa/turn_off")
    async disableTwoFa(@Request() req, @Res() res: ExpressResponse) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        return (await this.authService.turnOffTwoFactorAuthentication(req, res, user));
    }

    @UseGuards(Jwt2faAuthGuard) // To make sure the user is authenticated !
    @Get('me')
    async getMe(@Request() req) {
        const me = await this.userService.getUserByToken(req.cookies.token);
        delete me.hash;
        delete me.accessToken;
        return me;
    }

    // @UseGuards(Jwt2faAuthGuard)
    @Get('user-info')
    async getUserInfo(@Req() req, @Res() res: ExpressResponse) {
        try {
            const user = await this.userService.getUserByToken(req.cookies.token);
            // Send back only the necessary user information
            return res.status(200).json({
                username: user.username,
                email: user.email,
                // other fields you want to include 
            });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    @Get('user-info/:username')
    async getUserInfoDynamic(@Param('username') username: string, @Res() res: ExpressResponse) {
        try {
            const user = await this.userService.getUserByUsername(username); // Assuming you have a method to get user by username
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            // Send back only the necessary user information
            return res.status(200).json({
                username: user.username,
                email: user.email,
                totalGamesWon: user.totalGamesWon,
                totalGamesLost: user.totalGamesLost,
                eloRating: user.eloRating,
                img_url: user.img_url,
                nbrFriends: user.friends.length

                // other fields you want to include
            });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Endpoint for global leaderboard
    @Get('/leaderboard')
    async getGlobalLeaderboard() {
        return this.userService.getGlobalLeaderboard();
    }

    // Endpoint for user-specific leaderboard
    @Get('/leaderboard/:username')
    async getUserLeaderboard(@Param('username') username: string) {
        return this.userService.getUserLeaderboard(username);
    }

    @Get('match-history/:username')
    async getMatchHistory(@Param('username') username: string, @Res() res: ExpressResponse) {
        try {
            const user = await this.userService.getUserByUsername(username);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const matchHistory = await this.prisma.game.findMany({
                where: {
                    OR: [
                        { player1Id: user.id },
                        { player2Id: user.id }
                    ]
                },
                include: {
                    winner: true,
                    loser: true,
                    player1: true,
                    player2: true
                }
            });

            const detailedMatchHistory = matchHistory.map(match => ({
                ...match,
                player1Username: match.player1.username,
                player2Username: match.player2.username,
                winnerUsername: match.winner ? match.winner.username : null,
                loserUsername: match.loser ? match.loser.username : null
            }));
            // console.log(detailedMatchHistory)
            return res.status(200).json(detailedMatchHistory);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    @Post('upload-avatar')
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: diskStorage({
                destination: './uploads', // Ensure this directory exists and is writable
                filename: (req, file, callback) => {
                    const uniqueName = `${Date.now()}-avatar-${file.originalname}`;
                    callback(null, uniqueName);
                },
            }),
            fileFilter: imageFileFilter,
            limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
        }),
    )

    async uploadAvatar(@UploadedFile() file, @Req() request) {
        const username = request.body.username; // Get the username from the request body

        if (!file || !username) {
            throw new HttpException('Error uploading file', HttpStatus.BAD_REQUEST);
        }

        try {
            // Retrieve the user's ID by username using your UserService or Prisma method
            const userId = await this.userService.getUserIdByUsername(username);

            if (!userId) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }

            // Implement your logic to handle the file, save the path to the database, etc.
            // For example, you can save the file path to the user's avatar field in the database.
            const filePath = `./uploads/${file.filename}`;
            const fileUrl = `${request.protocol}://${request.get('host')}/uploads/${file.filename}`;
            console.log(fileUrl)
            // Update the user's avatar using the retrieved userId
            // await this.userService.updateUserAvatar(userId, filePath);
            await this.userService.updateUserAvatar(userId, fileUrl); // Pass fileUrl instead of filePath
            // return { message: 'File uploaded successfully', filePath: file.filename };
            return { message: 'File uploaded successfully', fileUrl }; // Return fileUrl in the response
        } catch (error) {
            // Handle any errors that occur during file handling, user retrieval, or database update
            throw new HttpException('Error uploading file', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
