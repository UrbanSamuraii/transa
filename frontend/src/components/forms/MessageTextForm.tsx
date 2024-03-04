import React, { useState } from 'react';
import axios from 'axios';
import '../conversations/GlobalConversations.css';
import { MessageInputFieldProps } from '../messages/MessageInputField';
import { MessageInputFieldStyle, MessageInputContainer, MessageInputTextArea, MessageSendButton } from '../../utils/styles';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

export const MessageInputTextForm = ({ conversationId }: MessageInputFieldProps) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = event.target.value;
        const newValue = text.replace(/\r?\n/g, '\n');
        setContent(newValue);
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            setContent((prevContent) => prevContent + "\n");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        try {
            setLoading(true);
            await axios.post(`http://${server_adress}:3001/messages`, { content, conversationId }, {
                withCredentials: true,
            });
            setContent('');
        } catch (error) {
            console.error('Sending message error:', error);
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.data) {
                    const customError = error.response.data.error;
                    if (customError) {
                        alert(`Error: ${customError}`);
                    }
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <MessageInputFieldStyle>
                <MessageInputContainer>
                    <MessageInputTextArea
                        id="message-input"
                        rows={3}
                        placeholder="Type your message..."
                        spellCheck={false}
                        value={content}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                    />
                    <MessageSendButton type="submit" disabled={loading}>
                    <i className='bx bxs-send'></i>
                    </MessageSendButton>
                </MessageInputContainer>
            </MessageInputFieldStyle>
        </form>
    );
};

export default MessageInputTextForm;
