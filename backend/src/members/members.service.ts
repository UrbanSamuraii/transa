import { Injectable } from "@nestjs/common";
import { Conversation, User } from '@prisma/client';
import { PrismaService } from "../prisma/prisma.service";
import { IMembersService } from './members' 
import { UserService } from "src/user/user.service";

@Injectable()
export class MembersService implements IMembersService {
	
	constructor(private prismaService: PrismaService,
				private userService: UserService) {};

	///////// MEMBER RELATION ////////

	async findMemberInConversation(conversationId: number, userId: number): Promise<User | null> {
		const conversation = await this.prismaService.conversation.findUnique({
			where: { id: conversationId },
			include: { members: true },
		});
		
		if (!conversation) { return null; }
		
		const memberFinded = conversation.members.find((member) => member.id === userId);
		
		return memberFinded || null; // Return the found member or null if not found
	}
	
	// To return the conversations into the profil 
	async getMemberWithConversationsHeIsMemberOf(user: User) {
		const userWithConversations = await this.prismaService.user.findUnique({
			where: { id: user.id },
			include: {
			  conversations: {
				orderBy: {
                    updatedAt: 'desc', // Order conversations by updatedAt in descending order
                },
				include: {
				  members: {
					where: {
					  id: {
						not: user.id, // Exclude the current user in the return but not from the conversations -> only way for displaying properly the conv
					  }
					},
					select: {
					  username: true, // Select only the 'username' field of the members
					}
				  },
				  messages: {
					orderBy: {
					  createdAt: 'desc', // Order messages by createdAt in descending order
					},
					take: 1, // Take the first message = the newest one
				  },
				}
			  }
			}
		});
		
		return userWithConversations;
	}

	///////// ADMIN RELATION ////////

	async isAdmin(conversationId: number, userId: number): Promise<boolean | null> {
		const conversation = await this.prismaService.conversation.findUnique({
			where: { id: conversationId },
			include: { admins: true },
		});
		
		if (!conversation) { return null; }
		
		const memberAdminFinded = conversation.admins.find((member) => member.id === userId);
		if (memberAdminFinded) { return true; }
		else { return false; }
	}

	///////// MUTE RELATION ////////

	async isMuteMember(conversationId: number, userId: number): Promise<boolean | null> {
		const conversation = await this.prismaService.conversation.findUnique({
			where: { id: conversationId },
			include: { muted: true },
		});
		
		if (!conversation) { return null; }
		
		const memberMuteFinded = conversation.muted.find((member) => member.id === userId);
		if (memberMuteFinded) { return true; }
		else { return false; }
	}

}

