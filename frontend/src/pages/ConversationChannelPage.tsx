import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { ConversationChannelPageStyle } from "../utils/styles"
import { getConversationsIdentified } from "../utils/hooks/getConversationsIdentified";
import { ConversationMessage } from "../utils/types";
import { MessageContainer } from "../components/messages/MessageContainer";
import { ScrollableContainer } from "../components/messages/MessagePanel";
import { MessagePanelHeader } from "../components/messages/MessagePanelHeader";
import { MessageInputField } from "../components/messages/MessageInputField";
import { useAuth } from '../utils/hooks/useAuthHook';
import { useSocket } from '../SocketContext';
import { OverlayStyle, OverlayContent } from '../utils/styles';
import OutsideClickHandler from 'react-outside-click-handler';

type GameInviteData = {
    target: string;
};

interface NavigateToGameEvent {
    url: string;
}

export const ConversationChannelPage = () => {

    const conversationId = useParams().id;
    const [conversationsArray, setConversationsArray] = useState<ConversationMessage[]>([]);
    const { user } = useAuth();
    const chatSocketContextData = useSocket();
    const [showGameInvite, setShowGameInvite] = useState(false);
    const [gameInviteData, setGameInviteData] = useState<GameInviteData | null>(null);

    const navigate = useNavigate()

    useEffect(() => {
        chatSocketContextData?.socket?.on('onRemovedMember', (payload: any) => {
            if (conversationId === payload.conversationId) {
                navigate('/ConversationPage');
            }
        });
        return () => {
            chatSocketContextData?.socket?.off('onRemovedMember');
        };
    }, [[chatSocketContextData, conversationId]]);

    // To set all messages from the conv - need to sort on the getter at the backend
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const conversations = await getConversationsIdentified(conversationId);
                setConversationsArray(conversations);
            } catch (error) {
                console.error("Error fetching conversations:", error);
                navigate('/ConversationPage');
            }
        };
        fetchConversations();

        console.log("Blocking / Unblocking !!!");

        const socket = chatSocketContextData?.socket;
        if (socket) { socket.on('onBeingBlockedorBlocked', fetchConversations) }
        return () => {
            if (socket) { socket.off('onBeingBlockedorBlocked', fetchConversations) }
        };
    }, [chatSocketContextData, chatSocketContextData?.socket, conversationId]);

    // To get last message sent - need to not socket emit to the user who blocked the author
    useEffect(() => {
        chatSocketContextData?.socket?.on('onMessage', (payload: ConversationMessage) => {
            chatSocketContextData.setLastMessageDeleted(false);
            const payloadConversationId = Number(payload.conversation_id);
            if (payloadConversationId === Number(conversationId)) {
                setConversationsArray(prevConversations => {
                    const newState = [payload, ...prevConversations];
                    return newState;
                });
            }
        });
        return () => {
            chatSocketContextData?.socket?.off('onMessage');
        };
    }, [[chatSocketContextData.socket, conversationId]]);

    useEffect(() => {
        chatSocketContextData?.socket?.on('onDeleteMessage', (deletedMessage: ConversationMessage) => {
            const isMessageInConversation = deletedMessage.conversation_id === Number(conversationId);
            if (isMessageInConversation) {
                setConversationsArray(prevConversations => {
                    return prevConversations.filter(message => message.id !== deletedMessage.id);
                });
            }
        });
        return () => {
            chatSocketContextData?.socket?.off('onDeleteMessage');
        };
    }, [chatSocketContextData, conversationId]);

    useEffect(() => {
        const displayGameInvite = (data: any) => {
            setShowGameInvite(true);
            setGameInviteData(data);
            // console.log(data.target);
        }

        // displayGameInvite();
        chatSocketContextData?.socket?.on('inviteGame', displayGameInvite);
        return () => {
            chatSocketContextData?.socket?.off('inviteGame', displayGameInvite);
        };
    }, [chatSocketContextData.socket, chatSocketContextData]);

    useEffect(() => {
        const handleNavigateToGame = ({ url }: NavigateToGameEvent) => {
            navigate(url);
        };

        const socket = chatSocketContextData?.socket;
        socket?.on('navigateToGame', handleNavigateToGame);

        return () => {
            socket?.off('navigateToGame', handleNavigateToGame);
        };
    }, [chatSocketContextData?.socket, navigate]);

    const handleAcceptGameInvite = () => {
        setShowGameInvite(false);
        if (gameInviteData) {
            console.log(`senderUsername: ${gameInviteData.target}`)
            const senderUsername = user.username;
            const targetUsername = gameInviteData.target;

            const response = { targetUsername: targetUsername, senderUsername: senderUsername, accepted: true };
            chatSocketContextData?.socket?.emit('gameInviteResponse', response);
        }
    };

    const handleRefuseGameInvite = () => {
        setShowGameInvite(false);
        if (gameInviteData) {
            const senderUsername = gameInviteData.target;

            const response = { target: senderUsername, accepted: false };
            chatSocketContextData?.socket?.emit('gameInviteResponse', response);
        }
    };

    return (
        <ConversationChannelPageStyle>
            {showGameInvite && (
                <OverlayStyle>
                    <OutsideClickHandler onOutsideClick={() => {
                        setShowGameInvite(false);
                    }}>
                        <OverlayContent>
                            <div className="game-invite-interface">
                                <p>You have received a game invite!</p>
                                <button onClick={handleAcceptGameInvite}>Yes</button>
                                <button onClick={handleRefuseGameInvite}>No</button>
                            </div>
                        </OverlayContent>
                    </OutsideClickHandler>
                </OverlayStyle>
            )}
            <MessagePanelHeader conversationId={Number(conversationId)} />
            <ScrollableContainer>
                {conversationsArray.length > 0 ? (
                    conversationsArray.slice().reverse().map((conversation, index) => (
                        <MessageContainer key={index} message={conversation} isCurrentUser={user.username === conversation.authorName} />
                    ))
                ) : (
                    <div></div>
                )}
                <MessageInputField conversationId={Number(conversationId)} />
            </ScrollableContainer>
        </ConversationChannelPageStyle>
    );
};
