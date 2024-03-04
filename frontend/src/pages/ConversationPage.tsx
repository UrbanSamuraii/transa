import { Outlet } from 'react-router-dom';
import { Page } from '../utils/styles';
import { ConversationSidebar } from '../components/conversations/ConversationSidebar';
import { useParams, useNavigate } from 'react-router-dom';
import { ConversationPanel } from '../components/conversations/ConversationPannel';
import { ConversationMessage } from "../utils/types";
import { useEffect, useState, useContext } from 'react';
import { getConversations } from '../utils/hooks/getConversations';
import { useSocket } from '../SocketContext';
import { useAuth } from '../utils/hooks/useAuthHook';

type GameInviteData = {
    target: string;
};

interface NavigateToGameEvent {
    url: string;
}


export const ConversationPage = () => {

    const { id } = useParams();
    const [prismaConversations, setPrismaConversations] = useState<any[]>([]);
    const { socket, isLastMessageDeleted } = useSocket();
    const [showGameInvite, setShowGameInvite] = useState(false);
    const [gameInviteData, setGameInviteData] = useState<GameInviteData | null>(null);
    const chatSocketContextData = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate()

    useEffect(() => {
        const fetchConversations = async () => {
            // console.log("ConversationPage WORKING ON");
            try {
                const prismaConversations = await getConversations();
                setPrismaConversations(prismaConversations);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        };

        const displayGameInvite = (data: any) => {
            setShowGameInvite(true);
            console.log(data.target);
        }

        fetchConversations();
        // displayGameInvite();

        chatSocketContextData?.socket?.on('onNewMessage', fetchConversations);
        chatSocketContextData?.socket?.on('onJoinRoom', fetchConversations);
        chatSocketContextData?.socket?.on('onRemovedMember', fetchConversations);
        chatSocketContextData?.socket?.on('onBeingBlockedorBlocked', fetchConversations);
        chatSocketContextData?.socket?.on('inviteGame', displayGameInvite);
        return () => {
            chatSocketContextData?.socket?.off('onNewMessage', fetchConversations);
            chatSocketContextData?.socket?.off('onJoinRoom', fetchConversations);
            chatSocketContextData?.socket?.off('onRemovedMember', fetchConversations);
            chatSocketContextData?.socket?.off('onBeingBlockedorBlocked', fetchConversations);
            chatSocketContextData?.socket?.off('inviteGame', displayGameInvite);
        };
    }, [chatSocketContextData.socket, chatSocketContextData, isLastMessageDeleted]);

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
        <Page>
            <ConversationSidebar conversations={prismaConversations} />
            {!id && <ConversationPanel />}

            {showGameInvite && (
                <div className="game-invite-interface">
                    <p>You have received a game invite!</p>
                    <button onClick={handleAcceptGameInvite}>Yes</button>
                    <button onClick={handleRefuseGameInvite}>No</button>
                </div>
            )}

            <Outlet />
        </Page>
    );
};
