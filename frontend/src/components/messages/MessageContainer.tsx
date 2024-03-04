import { MessageContainerStyle, MessageContainerPersonnalStyle, DarkRedButton } from '../../utils/styles';
import { ConversationMessage } from '../../utils/types';
import { FC, useState, useContext } from 'react';
import axios from 'axios';
import { useSocket } from '../../SocketContext';
import './GlobalMessages.css'
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

type ConversationMessageProps = {
    message: ConversationMessage;
    isCurrentUser: boolean;
};

const formatDate = (updatedAtDate : Date): string => {
    const now = new Date();
    const timeDiff = now.getTime() - updatedAtDate.getTime();
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const formatTime = (value: number): string => (value < 10 ? `0${value}` : `${value}`);

    if (days === 0) {
        if (hours === 0) {
            if (minutes === 0) {
                return `just now`;
            }
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        }
        return `today at ${formatTime(updatedAtDate.getHours())}:${formatTime(updatedAtDate.getMinutes())}`;
    } else if (days === 1) {
        return `yesterday at ${formatTime(updatedAtDate.getHours())}:${formatTime(updatedAtDate.getMinutes())}`;
    } else {
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const month = monthNames[updatedAtDate.getMonth()];
        return `${month} ${updatedAtDate.getDate()} at ${formatTime(updatedAtDate.getHours())}:${formatTime(updatedAtDate.getMinutes())}`;
        }
    };

export const MessageContainer: FC<ConversationMessageProps> = ({ message, isCurrentUser }) => {

    const updatedAtDate = new Date(message.updatedAt);
    const updatedAtFormatted = formatDate(updatedAtDate);
    const [showDeleteButton, setShowDeleteButton] = useState(false);
    const chatSocketContextData = useSocket();
    const { isLastMessageDeleted, setLastMessageDeleted, setConversationId } = useSocket();

    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setShowDeleteButton(true);
    };

    const handleDelete = async (messageToDelete: ConversationMessage) => {
        const response = await axios.post(`http://${server_adress}:3001/messages/deleteMessage`, { messageToDelete: messageToDelete }, {
            withCredentials: true,
        });
        if (response.data.isLastMessageDeleted === true) {
            setLastMessageDeleted(true);
            setConversationId(messageToDelete.conversation_id);
        }
        setShowDeleteButton(false);
    };

    if (isCurrentUser === true) {
        return (
            <MessageContainerPersonnalStyle onContextMenu={handleContextMenu} onMouseLeave={() => setShowDeleteButton(false)}>
                <div className="messageAuthorName">
                    {message.authorName}:
                </div>
                <div className="messageText">
                    {message.message}
                </div>
                <div className="dateMessage">
                    {updatedAtFormatted}
                </div>
                {showDeleteButton && (<DarkRedButton onClick={() => handleDelete(message)}>Delete</DarkRedButton>)}
            </MessageContainerPersonnalStyle>
        );
    }
    else {
        return (
            <MessageContainerStyle>
                <div className="messageAuthorName">
                    {message.authorName}:
                </div>
                <div className="messageText">
                    {message.message}
                </div>
                <div className="dateMessage">
                    {updatedAtFormatted}
                </div>
            </MessageContainerStyle>
        );
    }
};
