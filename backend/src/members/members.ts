import { User } from "@prisma/client";

export interface IMembersService {
	findMemberInConversation(conversationID: number, userId: number): Promise<User>;
	getMemberWithConversationsHeIsMemberOf(user: User);
	isAdmin(conversationId: number, userId: number): Promise<boolean | null>;
	isMuteMember(conversationId: number, userId: number): Promise<boolean | null>;
}



