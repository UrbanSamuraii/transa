import { MessageInputTextForm } from '../forms/MessageTextForm';
import React, { FC } from "react";

export type MessageInputFieldProps = {
	conversationId: number;
};

export const MessageInputField: FC<MessageInputFieldProps> = ({ conversationId }) => {
	return (
		<MessageInputTextForm conversationId={Number(conversationId)} />
	);
  };