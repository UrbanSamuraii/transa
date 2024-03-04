export type User = {
	username: string;
}

export type ConversationType = {
	id: number;
	name: string;
	messages: { message: string, authorName: string }[];
	members: User[];
}

export type ConversationMessage = {
	author: { id: number };
	authorName: string;
	conversation_id: number;
	createdAt: string;
	id: number;
	message: string;
	updatedAt: string;
  };

