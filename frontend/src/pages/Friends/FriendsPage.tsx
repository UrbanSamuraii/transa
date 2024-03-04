import axios from 'axios';
import './FriendsPage.css';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { Friendspage, InvitationContainer, InvitationsListContainer, InvitationBarContainer, FriendsListContainer, FriendsListTitle, FriendItem, InvitationItem, InvitationBar } from './FriendsElems';
import { useSocket } from '../../SocketContext';
import { getFriendsList } from '../../utils/hooks/getFriendsList';
import { getInvitationsList } from '../../utils/hooks/getInvitationsList';
import DOMPurify from 'dompurify';
import { ErrorMessageModal } from '../../components/modals/ErrorMessageModal';
import OutsideClickHandler from 'react-outside-click-handler';

export const FriendsPage = () => {

    const chatSocketContextData = useSocket();
    const [friendsList, setFriendsList] = useState<any[]>([]);
    const [invitationsList, setInvitationsList] = useState<any[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [customError, setCustomError] = useState<string>('');
    const [showModalError, setShowModalError] = useState<boolean>(false);

    const handleButtonClick = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleOutsideClick = () => {
        setIsMenuOpen(false);
    };


    const handleShowModalError = () => {
    setShowModalError(true);
    };

    const handleCloseModalError = () => {
    setShowModalError(false);
    };

    useEffect(() => {
        const fetchFriendsList = async () => {
            try {
                const friendsList = await getFriendsList();
                setFriendsList(friendsList);
            } catch (error) {
                console.error('Error fetching friends list:', error);
            }
        };

        const fetchInvitationsList = async () => {
            try {
                const invitationsList = await getInvitationsList();
                setInvitationsList(invitationsList);
            } catch (error) {
                console.error('Error fetching invitations list:', error);
            }
        };

        fetchFriendsList();
        fetchInvitationsList();

        const socket = chatSocketContextData?.socket;
        if (socket) {
            socket.on('changeInFriendship', fetchFriendsList);
            socket.on('changeInFriendship', fetchInvitationsList);
        }
        return () => {
            if (socket) {
                socket.off('changeInFriendship', fetchFriendsList);
                socket.off('changeInFriendship', fetchInvitationsList);
            }
        };

    }, [chatSocketContextData]);

    const handleRemoveFriend = async (friendId: number) => {
        try {
            await axios.post(`http://${process.env.REACT_APP_SERVER_ADRESS}:3001/users/remove_friend`, { friendId: friendId }, {
                withCredentials: true
            });
        } catch (error: any) {
            const err = error as AxiosError;
            if (axios.isAxiosError(error)) {
                console.log(err.response);
                if (error.response && error.response.data) {
                    if (error.response.data.message) { 
                        const receivedCustomError: string = error.response.data.message;
                        setCustomError(receivedCustomError);}
                    else { 
                        const receivedCustomError: string = error.response.data.error; 
                        setCustomError(receivedCustomError);}
                    handleShowModalError();
                }
            }
        }
    };

    const handleSendInvitation = async (invitationDetails: { usernameOrEmail: string }) => {
        try {
            await axios.post(`http://${process.env.REACT_APP_SERVER_ADRESS}:3001/users/send_invitation`, { userName: DOMPurify.sanitize(invitationDetails.usernameOrEmail) }, {
                withCredentials: true
            });
        } catch (error: any) {
            const err = error as AxiosError;
            if (axios.isAxiosError(error)) {
                console.log(err.response);
                if (error.response && error.response.data) {
                    if (error.response.data.message) { 
                        const receivedCustomError: string = error.response.data.message;
                        setCustomError(receivedCustomError);}
                    else { 
                        const receivedCustomError: string = error.response.data.error; 
                        setCustomError(receivedCustomError);}
                    handleShowModalError();
                }
            }
        }
    };

    const handleAcceptInvitation = async (invitationId: number) => {
        console.log("Invitation from id USER :", invitationId);
        try {
            await axios.post(`http://${process.env.REACT_APP_SERVER_ADRESS}:3001/users/add_friend`, { invitationId: invitationId }, {
                withCredentials: true
            });
        } catch (error: any) {
            const err = error as AxiosError;
            if (axios.isAxiosError(error)) {
                console.log(err.response);
                if (error.response && error.response.data) {
                    if (error.response.data.message) { 
                        const receivedCustomError: string = error.response.data.message;
                        setCustomError(receivedCustomError);}
                    else { 
                        const receivedCustomError: string = error.response.data.error; 
                        setCustomError(receivedCustomError);}
                    handleShowModalError();
                }
            }
        }
    };

    const handleRefuseInvitation = async (invitationId: number) => {
        try {
            await axios.post(`http://${process.env.REACT_APP_SERVER_ADRESS}:3001/users/refuse_invitation`, { invitationId: invitationId }, {
                withCredentials: true
            });
        } catch (error: any) {
            const err = error as AxiosError;
            if (axios.isAxiosError(error)) {
                console.log(err.response);
                if (error.response && error.response.data) {
                    if (error.response.data.message) { 
                        const receivedCustomError: string = error.response.data.message;
                        setCustomError(receivedCustomError);}
                    else { 
                        const receivedCustomError: string = error.response.data.error; 
                        setCustomError(receivedCustomError);}
                    handleShowModalError();
                }
            }
        }
    };


    return (
        <>
        {customError && showModalError && <ErrorMessageModal setShowModalError={handleCloseModalError} errorMessage={customError} />}
        <Friendspage>
                <FriendsListContainer>
                    <FriendsListTitle>
                    Friends
                    <button className='friend-invitation-button' onClick={handleButtonClick}><i className='bx bxs-user-plus' ></i></button>
                    </FriendsListTitle>
                    <div>
                        {friendsList.map((friend) => (
                            <FriendItem
                                key={friend.id}
                                friend={{ id: friend.id, username: friend.username, status: friend.status, img_url: friend.img_url }}
                                removeFriend={handleRemoveFriend}
                            />
                        ))}
                    </div>
                </FriendsListContainer>
                <InvitationContainer>
                    {isMenuOpen && (
                            <div className="overlay-friends">
                                <OutsideClickHandler onOutsideClick={handleOutsideClick}>
                                    <InvitationBarContainer>
                                        <InvitationBar sendInvitation={handleSendInvitation} />
                                    </InvitationBarContainer>
                                </OutsideClickHandler>
                            </div>
                    )}
                    <InvitationsListContainer>
                        <FriendsListTitle>Invitations</FriendsListTitle>
                        <div>
                            {invitationsList.map((invitation) => (
                                <InvitationItem
                                    key={invitation.id}
                                    invitation={{ id: invitation.id, username: invitation.username }}
                                    acceptInvitation={handleAcceptInvitation}
                                    refuseInvitation={handleRefuseInvitation}
                                />
                            ))}
                        </div>
                    </InvitationsListContainer>
                </InvitationContainer>
        </Friendspage>
        </>
    );
};
