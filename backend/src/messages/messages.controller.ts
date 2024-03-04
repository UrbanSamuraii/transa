import { Controller, Post, Delete, Get, Res, UseGuards, Req, Param, HttpException, HttpStatus } from '@nestjs/common';
import { Jwt2faAuthGuard } from 'src/auth/guard';
import { Response as ExpressResponse } from 'express';
import { MessagesService } from './messages.service';
import { Prisma, User } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { ConversationsService } from 'src/conversations/conversations.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@UseGuards(Jwt2faAuthGuard)
@Controller('messages')
export class MessagesController {

	constructor(private prismaService: PrismaService,
		private userService: UserService,
		private messagesService: MessagesService,
		private conversationsService: ConversationsService,
		private eventEmitter: EventEmitter2) { }

	@Post()
	async createMessage(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		
		const user = await this.userService.getUserByToken(req.cookies.token);
		const convId = req.body.conversationId;
		const content = req.body.content;

		const conversation = await this.prismaService.conversation.findUnique({
			where: { id: convId },
			include: { members: true, messages: true },
		});
		if (!conversation) { throw new HttpException("Conversation not found", HttpStatus.NOT_FOUND)};

		const newMessage = await this.messagesService.createMessage(user, content, conversation);
		if (newMessage) {
			this.conversationsService.updateConversationDate(convId);
			this.eventEmitter.emit('message.create', {newMessage, user});
			res.status(200).json({ message: "Message created", messageCreated: newMessage });}
	}

	@Get(':conversationId')
	async getMessagesFromConversationId(@Param('conversationId') conversationId: string, @Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const user = await this.userService.getUserByToken(req.cookies.token);
		const blockedUsers = user.blockedUsers || [];
		const blockedBy = user.blockedBy || [];
		const conversation = await this.conversationsService.getConversationWithAllMessagesById(parseInt(conversationId), blockedUsers, blockedBy);
		if (!conversation) {throw new HttpException("Conversation not found", HttpStatus.NOT_FOUND)}
		const messagesInTheConversationId = conversation.messages;
		return messagesInTheConversationId;
	}

	@Post('deleteMessage')
	async deleteMessageFromConversationId(@Req() req, @Res({ passthrough: true }) res: ExpressResponse) {
		const messageToDelete = req.body.messageToDelete;
		const conversationId = messageToDelete.conversation_id;
		const existingConversation = await this.prismaService.conversation.findUnique({
			where: { id: conversationId },
			include: { messages: true },
		});
		const messageId = messageToDelete.id;
		console.log("Message id to delete", messageId);

		let isLastMessageDeleted = false;
		const numberOfMessages = existingConversation.messages.length;
		if (messageId === existingConversation.messages[numberOfMessages - 1].id) { 
			isLastMessageDeleted = true;
			this.eventEmitter.emit('last.message.deleted', messageToDelete);
		}
		
		await this.conversationsService.deleteMessageFromConversation(conversationId, messageId);
		
		this.eventEmitter.emit('message.deleted', messageToDelete);
		res.status(200).json({ message: "Message deleted", messageDeleted: messageToDelete, isLastMessageDeleted: isLastMessageDeleted });
	}
}
