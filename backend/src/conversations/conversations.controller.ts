import { Controller, Post, Body, Get, Res, UseGuards, Req, Param, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { AdminGuard, Jwt2faAuthGuard, OwnerGuard } from 'src/auth/guard';
import { Response as ExpressResponse } from 'express';
import { ConversationsService } from './conversations.service';
import { User, privacy_t } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { MembersService } from 'src/members/members.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagesService } from 'src/messages/messages.service';
import { GetUser } from 'src/auth/decorator';
import { ForbiddenExceptionFilter } from 'src/common/filters/forbidden-exception.filter';

@UseGuards(Jwt2faAuthGuard)
@Controller('conversations')
export class ConversationsController {

    constructor(private convService: ConversationsService,
        private userService: UserService,
        private memberService: MembersService,
        private messagesService: MessagesService,
        private eventEmitter: EventEmitter2) { }

    @Post('create')
    async CreateConversation(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const invitedMembers = await Promise.all(
            req.body.users.map(async (usernameOrEmail) => {
                const member = await this.userService.getUserByUsernameOrEmail(usernameOrEmail);
                return member;
            })
        );
        console.log("INVITED MEMBERS", invitedMembers);
        let convName = null;
        if (req.body.name) {
            convName = await this.convService.establishConvName(req.body.name);
        }
        else {
            if (invitedMembers && invitedMembers.length > 0) {
                const usernames = [user.username, ...(invitedMembers.map(member => member.username))];
                convName = usernames.join(' ');
            }
        }
        const createdConversation = await this.convService.createConversation(convName, user, invitedMembers);
        if (!createdConversation) {
            throw new ForbiddenException(`Conversation ${req.body.name} already exist.`);
        }
        else {
            this.eventEmitter.emit('join.room', user, createdConversation.id);
            this.eventEmitter.emit('message.create', '');
            if (invitedMembers && invitedMembers.length > 0) {
                for (const invitedMember of invitedMembers) {
                    this.eventEmitter.emit('join.room', invitedMember, createdConversation.id);
                }
            }
            res.status(201).json({
                message: invitedMembers ? "Conversation created with invited members" : "Conversation created",
                conversationId: createdConversation.id
            });
        }
    }

    @Get()
    async GetConversations(@Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const userWithConversations = await this.memberService.getMemberWithConversationsHeIsMemberOf(user);
        return (userWithConversations.conversations);
    }

    @Get(':id')
    async GetConversationById(@Param('id') id: string, @Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const blockedUsers = user.blockedUsers || [];
        const blockedBy = user.blockedBy || [];
        const idConv = parseInt(id);
        const conversation = await this.convService.getConversationWithAllMessagesById(idConv, blockedUsers, blockedBy);
        if (conversation) { return conversation; }
        else {
            console.log("CONV NOT FOUND")
            throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
        }
    }

    // WARNING : send back all OTHER MEMBERS of the conv' ! The user making the request is then excluded !!
    @Get(':id/members')
    async GetMembersInTheConversation(@Param('id') id: string, @Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const userId = user.id;
        const idConv = parseInt(id);
        const userList = await this.convService.getConversationOtherMembers(idConv, userId);
        if (userList) { return userList; }
        else { throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND); }
    }

    @Get(':id/muted_members')
    async GetMutedMembersInTheConversation(@Param('id') id: string, @Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const userId = user.id;
        const idConv = parseInt(id);
        const userList = await this.convService.getMutedOtherMembers(idConv, userId);
        if (userList) { return userList; }
        else { throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND); }
    }

    @Get(':id/not_muted_members')
    async GetUnmutedMembersInTheConversation(@Param('id') id: string, @Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const userId = user.id;
        const idConv = parseInt(id);
        const notMutesMemberList = await this.convService.getNotMutedOtherMembers(idConv, userId);
        if (notMutesMemberList) { return notMutesMemberList; }
        else { throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND); }
    }

    @Get(':id/admin_members')
    async GetAdminOtherMembers(@Param('id') id: string, @Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const userId = user.id;
        const idConv = parseInt(id);
        const userList = await this.convService.getAdminOtherMembers(idConv, userId);
        if (userList) { return userList; }
        else { throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND); }
    }

    @Get(':id/not_admin_members')
    async GetNotAdminOtherMembers(@Param('id') id: string, @Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const userId = user.id;
        const idConv = parseInt(id);
        const userList = await this.convService.getNotAdminOtherMembers(idConv, userId);
        if (userList) { return userList; }
        else { throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND); }
    }

    @Get(':id/banned_users')
    async GetBannedUserFromTheConversation(@Param('id') id: string, @Req() req) {
        const idConv = parseInt(id);
        const bannedUsersList = await this.convService.getBannedUsers(idConv);
        if (bannedUsersList) { return bannedUsersList; }
        else { throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND); }
    }

    // conversation status : Private or Public
    @Get(':id/status')
    async GetStatusOfTheConversation(@Param('id') id: string) {
        const idConv = parseInt(id);
        const status = await this.convService.getStatus(idConv);
        if (status != null) { return status; }
        else { throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND); }
    }

    // conversation status : Private or Public
    @Get(':id/isProtected')
    async GetProtectionOfTheConversation(@Param('id') id: string) {
        const idConv = parseInt(id);
        const status = await this.convService.isProtected(idConv);
        if (status != null) { return status; }
        else { throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND); }
    }

    @Get(':id/owner')
    async GetOwnerOfTheConversation(@Param('id') id: string) {
        const idConv = parseInt(id);
        const owner = await this.convService.getOwner(idConv);
        if (owner) { return owner; }
        else { throw new HttpException('Owner not found', HttpStatus.NOT_FOUND); }
    }

    @Get(':id/isAdmin')
    async IsAdminOfTheConversation(@Param('id') id: string, @Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const userId = user.id;
        const idConv = parseInt(id);
        const isAdmin = await this.convService.isAdminOfTheConv(userId, idConv);
        return (isAdmin);
    }

    @Post('join')
    async JoinConversation(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const conversation = await this.convService.getConversationByName(req.body.conversationName);

        if (!conversation) {
            throw new HttpException('Conversation not found.', HttpStatus.NOT_FOUND);
        }
        if (await this.convService.isUserIdBannedFromConversation(user.id, conversation.id)) {
            throw new HttpException('You are banned from this conversation.', HttpStatus.FORBIDDEN);
        }
        if (conversation.privacy === privacy_t.PRIVATE) {
            throw new HttpException("The conversation is private, you can't join it - please wait to be invite by an administrator.", HttpStatus.FORBIDDEN);
        }
        if (conversation.protected && conversation.password != null) {
            res.status(202).json({ message: "The conversation is protected by a password - you are going to be redirected to guard page.", conversationId: conversation.id }); return;
        }

        const added = await this.convService.addUserToConversation(user.id, conversation.id);
        if (added) {
            this.eventEmitter.emit('message.create', '');
            this.eventEmitter.emit('join.room', user, conversation.id);
            res.status(201).json({ message: "You have now joined the conversation.", conversationId: conversation.id }); return;
        }
        else {
            res.status(202).json({ message: "You were already in the conversation.", conversationId: conversation.id }); return;
        }
    }

    @Post('validate_password')
    async ValidatePassword(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        // We will have to insert the convID in the req somewhere.
        const conversation = await this.convService.getConversationById(req.body.convId);
        const passwordToValidate = conversation.password;

        if (req.body.password === passwordToValidate) {
            const added = await this.convService.addUserToConversation(user.id, conversation.id);
            if (added) {
                this.eventEmitter.emit('message.create', '');
                res.status(201).json({ message: "You have now joined the conversation." }); return;
            }
            else {
                res.status(403).json({ message: "You were already in the coonversation." }); return;
            }
        }
        else {
            res.status(403).json({ message: "Wrong password." }); return;
        }
    }

    @Post('block_user')
    async BlockUser(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const target = await this.userService.getUserByUsernameOrEmail(req.body.userName);
        if (!target) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        else {
            const isBlocked = await this.convService.blockUser(user.id, target.id);
            if (isBlocked) {
                res.status(201).json({ message: "You have successfully blocked the user." });
                this.eventEmitter.emit('block.user', { user, target });
                return;
            }
            else {
                res.status(403).json({ message: "The user is already blocked." }); return;
            }
        }
    }

    @Post('blocked_users_list')
    async GetBlockedUsersList(@Req() req) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        if (user) { return user.blockedUsers; }
        else { throw new HttpException('User not found', HttpStatus.NOT_FOUND); }
    }

    @Post('unblock_user')
    async UnblockUser(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const user = await this.userService.getUserByToken(req.cookies.token);
        const target = await this.userService.getUserByUsernameOrEmail(req.body.userToUnblock);
        if (!target) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        else {
            const unblockedUser = await this.convService.removeUserFromBlockList(user, target);
            if (unblockedUser) {
                res.status(201).json({ message: "User is now allowed in this conversation." });
                this.eventEmitter.emit('unblock.user', { user, target });
            }
            else {
                res.status(403).json({ message: "User wasn't banned from the conversation." });
            }
        }
    }

    @Get(':id/leave_conversation')
    async LeaveTheConversation(
        @Param('id') conversationId: string,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        const member = await this.userService.getUserByToken(req.cookies.token);
        // console.log("User leaving the room : ", user.username);
        const left = await this.convService.leaveTheConversation(member.id, parseInt(conversationId))
        if (left) {
            res.status(201).json({ message: "You have successfully left the conversation." });
            this.eventEmitter.emit('remove.member', { conversationId, member });
            return;
        }
        else {
            res.status(403).json({ message: "Can't remove the member you are looking for from this conversation." }); return;
        }
    }

    //////////////// HANDLE RULES AND MEMBERS OF SPECIFIC CONVERSATION ////////////////////

    // Admin can add users to conversation - no matter if it is a private or public one
    // The user who has been add doesn t need to enter the password if the conversation is protected
    @Post(':id/add_member')
    @UseGuards(AdminGuard)
    async AddMemberToConversation(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        let member = null;
        let added = false;
        member = await this.userService.getUserByUsernameOrEmail(req.body.userToAdd);
        if (!member) {
            res.status(400).json({ message: "User not found." }); return;
        }
        else {
            const userId = member.id;
            const isAlreadyMember = await this.convService.isMemberOfTheConversation(userId, parseInt(conversationId));
            if (isAlreadyMember) {
                res.status(400).json({ message: "User is already in the conversation." }); return;
            }
            else {
                added = await this.convService.addUserToConversation(userId, parseInt(conversationId))
                if (added) {
                    res.status(201).json({ message: "User added to the conversation." }); return;
                }
                else {
                    res.status(400).json({ message: "Can't add the user to the conversation." }); return;
                }
            }
        }
    }

    @Post(':id/remove_member')
    @UseGuards(AdminGuard)
    async RemoveMemberFromConversation(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        let member = null;
        let removed = false;
        member = await this.userService.getUserByUsernameOrEmail(req.body.memberToRemove);
        if (!member) {
            res.status(403).json({ message: "User not found." }); return;
        }
        else {
            const memberId = member.id;
            removed = await this.convService.removeMemberFromConversation(memberId, parseInt(conversationId))
            if (removed) {
                res.status(201).json({ message: "The member has been removed from the conversation." });
                this.eventEmitter.emit('remove.member', { conversationId, member });
                return;
            }
            else {
                res.status(403).json({ message: "Can't remove the member you are looking for from this conversation." }); return;
            }
        }
    }

    @Post(':id/get_member_mute')
    @UseGuards(AdminGuard)
    async muteMemberOfConversation(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        let member = null;
        let muted = false;
        member = await this.userService.getUserByUsernameOrEmail(req.body.userToMute);
        if (!member) {
            res.status(403).json({ message: "User not found in the conversation." }); return;
        }
        else if (member?.username === user.username) {
            res.status(403).json({ message: "You can't mute yoursel." }); return;
        }
        else {
            const userId = member.id;
            muted = await this.convService.muteMemberFromConversation(userId, parseInt(conversationId))
            if (muted) {
                res.status(201).json({ message: "User muted from the conversation." });
                this.eventEmitter.emit('mute.member', { user });
                return;
            }
            else {
                res.status(403).json({ message: "User is already in mute." }); return;
            }
        }
    }

    @Post(':id/get_member_unmute')
    @UseGuards(AdminGuard)
    async unmuteMemberOfConversation(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        let member = null;
        let muted = false;
        member = await this.userService.getUserByUsernameOrEmail(req.body.userToUnmute);
        if (!member) {
            res.status(403).json({ message: "User not found in the conversation." }); return;
        }
        else {
            const userId = member.id;
            muted = await this.convService.removeMemberFromMutedList(userId, parseInt(conversationId))
            if (muted) {
                res.status(201).json({ message: "User unmuted from the conversation." });
                this.eventEmitter.emit('unmute.member', { user });
                return;
            }
            else {
                res.status(401).json({ message: "User is already unmuted." }); return;
            }
        }
    }

    @Post(':id/update_member_to_admin')
    @UseGuards(AdminGuard)
    async UpdateMemberToAdmin(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        let member = null;
        let upgradedUser = false;
        console.log("User to upgrade : ", req.body.userToUpgrade);
        member = await this.userService.getUserByUsernameOrEmail(req.body.userToUpgrade);
        if (!member) {
            res.status(403).json({ message: "User not found in the conversation." });
        }
        else {
            const userId = member.id;
            upgradedUser = await this.convService.upgrateUserToAdmin(userId, parseInt(conversationId))
            if (upgradedUser) {
                res.status(201).json({ message: "User is now an admin of the conversation." });
                this.eventEmitter.emit('admin.status.member', { conversationId, member });
                this.eventEmitter.emit('admin.status.update', { user });
                return;
            }
            else {
                res.status(403).json({ message: "Can't update this user to admin of the conversation (is already an administrator ?)." }); return;
            }
        }
    }

    @Post(':id/downgrade_admin_to_member')
    @UseGuards(AdminGuard)
    async DowngradeAdminToMember(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        let member = null;
        let downgradedUser = false;
        (member = await this.userService.getUserByUsernameOrEmail(req.body.adminToDowngrade));
        if (!member) {
            res.status(403).json({ message: "User not found in the conversation." });
        }
        else {
            const userId = member.id;
            downgradedUser = await this.convService.downgradeAdminStatus(userId, parseInt(conversationId))
            if (downgradedUser) {
                res.status(201).json({ message: "User is not an admin of the conversation anymore." });
                this.eventEmitter.emit('admin.status.member', { conversationId, member });
                this.eventEmitter.emit('admin.status.downgrade', { user });
                return;
            }
            else {
                res.status(403).json({ message: "User wasn't an admin of the conversation." }); return;
            }
        }
    }

    @Post(':id/ban_user')
    @UseGuards(AdminGuard)
    async BanUserFromConversation(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        let member = null;
        member = await this.userService.getUserByUsernameOrEmail(req.body.userToBan);
        if (!member) {
            res.status(403).json({ message: "User not found." });
        }
        else {
            const userId = member.id;
            const bannedUser = await this.convService.banUserFromConversation(userId, parseInt(conversationId))
            if (bannedUser) {
                this.eventEmitter.emit('remove.member', { conversationId, member });
                res.status(201).json({ message: "User is now banned from the conversation." });
                return;
            }
            else {
                res.status(403).json({ message: "User is already banned from the conversation." });
            }
        }
    }

    @Post(':id/allow_user')
    @UseGuards(AdminGuard)
    async AllowUserOnConversation(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        let member = null;
        member = await this.userService.getUserByUsernameOrEmail(req.body.userToAllow);
        if (!member) {
            res.status(403).json({ message: "User not found." });
        }
        else {
            const userId = member.id;
            const allowedUser = await this.convService.removeUserFromBannedList(userId, parseInt(conversationId))
            if (allowedUser) {
                res.status(201).json({ message: "User is now allowed in this conversation." });
                this.eventEmitter.emit('unban.user', { user });
                return;
            }
            else {
                res.status(403).json({ message: "User wasn't banned from the conversation." }); return;
            }
        }
    }

    @Post(':id/verify_password')
    @UseGuards(OwnerGuard)
    async VerifyPassword(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {

        const oldPassword = await this.convService.getPassword(parseInt(conversationId));
        if (oldPassword) {
            if (oldPassword !== req.body.password) {
                res.status(403).json({ message: "Actual Password doesn't match." }); return;
            }
            else {
                res.status(201).json({ message: "Valid Password." }); return;
            }
        }
        else {
            res.status(201).json({ message: "The conversation is not protected." }); return;
        }
    }

    @Post(':id/set_newPassword')
    @UseGuards(OwnerGuard)
    async SetConversationPassword(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {

        const newPassword = await this.convService.setPassword(req.body.newPassword, parseInt(conversationId))
        if (newPassword) {
            res.status(201).json({ message: "New password well implemented." });
            this.eventEmitter.emit('change.password', { conversationId, newPassword });
            return;
        }
        else {
            res.status(201).json({ message: "The conversation is not protected." });
            this.eventEmitter.emit('change.password', { conversationId, newPassword });
            return;
        }
    }

    @Get(':id/set_private')
    @UseGuards(OwnerGuard)
    async SetConversationPrivate(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        console.log("Setting the conversation to PRIVATE");
        await this.convService.setConversationPrivate(parseInt(conversationId));
        const privacy = 'PRIVATE';
        this.eventEmitter.emit('change.privacy', { conversationId, privacy });
        res.status(201).json({ message: "Conversation is now Private." });
    }


    @Get(':id/set_public')
    @UseGuards(OwnerGuard)
    async SetConversationPublic(
        @Param('id') conversationId: string,
        @GetUser() user: User,
        @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
        console.log("Setting the conversation to PUBLIC");
        await this.convService.setConversationPublic(parseInt(conversationId));
        const privacy = 'PUBLIC';
        this.eventEmitter.emit('change.privacy', { conversationId, privacy });
        res.status(201).json({ message: "Conversation is now Public." });
    }

}


