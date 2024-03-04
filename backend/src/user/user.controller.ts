import { Controller, Get, UseGuards, Req, Res, Post, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { UserService } from 'src/user/user.service';
import { Jwt2faAuthGuard } from 'src/auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserNotFoundException } from 'src/common/custom-exception/user-not-found-exception';
import { InternalServerErrorException } from 'src/common/custom-exception/internal-servor-exception';


@UseGuards(Jwt2faAuthGuard)
@Controller('users')
export class UserController {
    
    constructor(private userService: UserService,
                private eventEmitter: EventEmitter2) { }

    @Get('me')
    getMe(@GetUser() user: User,
        @GetUser('email') email: string) {
        console.log(email);
        return user;
    }

    @Post('send_invitation')
	async InviteNewFriend(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const user = await this.userService.getUserByToken(req.cookies.token);
		const target = await this.userService.getUserByUsernameOrEmail(req.body.userName);
		if (!target || target.id == user.id) {
            throw new UserNotFoundException(); }
		else {
            const invitation_sent = await this.userService.sendInvitation(user.id, target.id);
            if (invitation_sent) {
                res.status(201).json({ message: "Invitation has been sent." }); 
                const userId = user ? user.id : null;
                const targetId = target ? target.id : null;
                this.eventEmitter.emit('friend', {userId, targetId});
                this.eventEmitter.emit('invitation', {targetId});
                return;} 
            else {
                throw new ForbiddenException(`User ${target.username} is already a friend.`);
            }
        }
    }

    @Post('refuse_invitation')
	async DeclineInvitation(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const user = await this.userService.getUserByToken(req.cookies.token);
		const target = await this.userService.getUserById(req.body.invitationId);
		if (!target) {
			throw new UserNotFoundException(); }
		else {
            const decline_invitation = await this.userService.declineInvitation(user.id, target.id);
            if (decline_invitation) {
                res.status(201).json({ message: "Invitation has been declined." }); 
                const userId = user ? user.id : null;
                const targetId = target ? target.id : null;
                this.eventEmitter.emit('friend', {userId, targetId});
                return;} 
            else {
                throw new InternalServerErrorException(); }
        }
    }

    @Get('get_invitations')
	async GetInvitationsList(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const user = await this.userService.getUserByToken(req.cookies.token);
		const invitationsList = await this.userService.getInvitations(user.id);
        if (invitationsList) { return invitationsList; } 
		else { throw new InternalServerErrorException(); }
    }

    @Post('add_friend')
	async AddNewFriend(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const user = await this.userService.getUserByToken(req.cookies.token);
		const target = await this.userService.getUserById(req.body.invitationId);
		if (!target || !user) {
			throw new UserNotFoundException();}
		else {
            const friend_added = await this.userService.addNewFriend(user.id, target.id);
            if (friend_added) {
                res.status(201).json({ message: "New friendship established." }); 
                const userId = user ? user.id : null;
                const targetId = target ? target.id : null;
                this.eventEmitter.emit('friend', {userId, targetId});
                return;} 
            else {
                throw new ForbiddenException(`User ${target.username} is already a friend.`); } 
        }
    }

    @Post('remove_friend')
	async RemoveFriend(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const user = await this.userService.getUserByToken(req.cookies.token);
		const target = await this.userService.getUserById(req.body.friendId);
		if (!target || !user) {
			throw new UserNotFoundException();}
		else {
            const friend_removed = await this.userService.removeFriend(user.id, target.id);
            if (friend_removed) {
                res.status(201).json({ message: "This user have been removed from your friends." }); 
                const userId = user ? user.id : null;
                const targetId = target ? target.id : null;
                this.eventEmitter.emit('friend', {userId, targetId});
                return;} 
            else {
                throw new ForbiddenException(`User ${target.username} is not a friend.`);} 
        }
    }

    @Get('get_friends')
    async GetFriendsList(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const user = await this.userService.getUserByToken(req.cookies.token);
		const friendsList = await this.userService.getUserFriendsList(user.id);
        if (friendsList) { return friendsList; } 
		else { throw new InternalServerErrorException(); }
    }

    @Post('invite_game')
    async InvitationGame(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const user = await this.userService.getUserByToken(req.cookies.token);
		const target = await this.userService.getUserByUsernameOrEmail(req.body.userToInvite);
        if (!target || !user) {
			throw new UserNotFoundException();}
		else {
            const userId = user ? user.id : null;
            const targetId = target ? target.id : null;
            console.log("userId", targetId);
            this.eventEmitter.emit('invite_game', {userId, targetId});
        }
    }
}   
