import { Message, User, Conversation } from '@prisma/client';

export interface IMessagesService {
	createMessage(author: User, content: string, conversation: Conversation): Promise<Message> ;

}