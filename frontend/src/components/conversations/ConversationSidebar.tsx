import { ConversationSidebarContainer, ConversationSidebarItem, ConversationSidebarStyle, ConversationSidebarTexts } from '../../utils/styles';
import { MdPostAdd } from 'react-icons/md';
import { ConversationType } from '../../utils/types';
import { FC, useState, useEffect } from 'react';
import './GlobalConversations.css';
import { ConversationMessage } from "../../utils/types";
import { useNavigate } from 'react-router-dom';
import { CreateConversationModal } from '../modals/CreateConversationModal';
import { JoinConversationModal } from '../modals/JoinConversationModal';
import { ConversationMenuModal } from '../modals/CreateConversationMenuModal';
import { BlockUserModal } from '../modals/BlockUserModal';
import { UnblockUserModal } from '../modals/UnblockUserModal';
import { useSocket } from '../../SocketContext';

type Props = {
    conversations: ConversationType[];
}

export const ConversationSidebar: FC<Props> = ({ conversations }) => {

    const navigate = useNavigate();
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showModalCreate, setShowModalCreate] = useState(false);
    const [showModalJoin, setShowModalJoin] = useState(false);
    const [showModalBlock, setShowModalBlock] = useState(false);
    const [showModalUnblock, setShowModalUnblock] = useState(false);

    const [lastMessageDeletedMap, setLastMessageDeletedMap] = useState<Record<string, boolean>>({});
    const chatSocketContextData = useSocket();
    const { isLastMessageDeleted, setLastMessageDeleted, conversationId } = useSocket();

    useEffect(() => {
        chatSocketContextData?.socket?.on('onDeleteLastMessage', (deletedMessage: ConversationMessage) => {
            chatSocketContextData.setLastMessageDeleted(true);
            setLastMessageDeletedMap(prevMap => ({
                ...prevMap,
                [chatSocketContextData.conversationId || ""]: chatSocketContextData.isLastMessageDeleted || false
            }));
        });
        return () => {
            chatSocketContextData.setLastMessageDeleted(false);
            chatSocketContextData?.socket?.off('onDeleteLastMessage');
        };
    }, [[chatSocketContextData, conversationId, isLastMessageDeleted]]);

    const handleMenuOptionClick = (option: string) => {
        setShowMenuModal(false);
        if (option === 'create') {
            setShowModalCreate(true);
        }
        else if (option === 'join') {
            setShowModalJoin(true);
        }
        else if (option === 'block') {
            setShowModalBlock(true);
        }
        else if (option === 'unblock') {
            setShowModalUnblock(true);
        }
    };

    const openMenu = () => {
        setShowMenuModal(true);
    };

    const closeMenu = () => {
        setShowMenuModal(false);
    };

    const colors = ['#9b59b6', '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#1abc9c'];

    return (
        <div className='chat'>
            {showMenuModal && ( <ConversationMenuModal
                setShowModal={() => {
                    setShowMenuModal(false);}}
                    onClose={closeMenu}
                    onOptionClick={handleMenuOptionClick}
                />)}
            {showModalCreate && (<CreateConversationModal
                setShowModal={() => {
                    setShowModalCreate(false);
                    setShowMenuModal(false);
                }} /> )}
            {showModalJoin && (<JoinConversationModal
                setShowModal={() => {
                    setShowModalJoin(false);
                    setShowMenuModal(false);
                }} /> )}
            {showModalBlock && (<BlockUserModal
                setShowModal={() => {
                    setShowModalBlock(false);
                    setShowMenuModal(false);
                }} /> )}
            {showModalUnblock && (<UnblockUserModal
                setShowModal={() => {
                    setShowModalUnblock(false);
                    setShowMenuModal(false);
                }} /> )}
            <div className='sideMenuHeader'>
                <header>
                    <div className="header-content">
                        <h2>chats</h2>
                        <button className='openMenuButton' onClick={openMenu}>
                            <MdPostAdd size={30} />{' '}
                        </button>
                    </div>
                </header>
                <ConversationSidebarContainer>
                    {conversations.map((conversation) => (
                        <ConversationSidebarItem key={conversation.id} onClick={() => navigate(`/ConversationPage/channel/${conversation.id}`)}>
                            <div className="conversationAvatar" style={{ backgroundColor: colors[conversation.id % colors.length] }}>
                            <i className='bx bxs-ghost'></i>
                            </div>
                            <ConversationSidebarTexts>
                                <div className="conversationName">
                                    <div> <span>{conversation.name || conversation.members[0].username}</span> </div>
                                </div>
                                <div className="conversationLastMessage">
                                    <div>
                                    <span>
                                    {lastMessageDeletedMap[conversation.id]
                                        ? 'Last message deleted'
                                        : conversation.messages.length > 0
                                        ? (
                                            <>
                                            <span className="author-name">{conversation.messages[0]?.authorName || 'Unknown User'}</span>: <span className="message-text">{conversation.messages[0]?.message}</span>
                                            </>
                                        )
                                        : <span className="no-messages">No messages here yet...</span>}
                                        </span>
                                    </div>
                                </div>
                            </ConversationSidebarTexts>
                        </ ConversationSidebarItem>))}
                </ConversationSidebarContainer>
            </div>
        </div>
    );
};
