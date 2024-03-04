import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../../AuthContext';
import { useState, useEffect } from 'react';
import { getInvitationsList } from '../../utils/hooks/getInvitationsList';
import { useSocket } from '../../SocketContext';

function Navbar() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const chatSocketContextData = useSocket();

    const [hasInvitations, setHasInvitations] = useState(false);

    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const invitationsList = await getInvitationsList();
                setHasInvitations(invitationsList.length > 0);
            } catch (error) {
                console.error('Error fetching invitations:', error);
            }
        };

        const socket = chatSocketContextData?.socket;
        if (socket) {
            socket.on('changeInFriendship', fetchInvitations);
        }
        return () => {
            if (socket) {
                socket.off('changeInFriendship', fetchInvitations);
            }
        };
    }, [chatSocketContextData]);

    return (
        <div className="navbar">
            <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'></link>
            <div className="navbar-left">
                <div className='navbar-button'>
                    <Link to="/" className="navbar-logo"></Link>
                </div>
            </div>
            <div className="navbar-center">
                {user && (
                    <>
                        <div className='navbar-button'>
                            <Link to="/ConversationPage">Chat</Link>
                        </div>
                        <div className='navbar-button'>
                            <Link to="/leaderboard">Leaderboard</Link>
                        </div>
                         <div className={`navbar-button ${hasInvitations ? 'has-invitations' : ''}`}>
                            <Link to="/friends">
                                Friends
                                {hasInvitations && (
                                    <span className="invitation-star">&#9733;</span>
                                )}
                            </Link>
                        </div>
                    </>
                )}
            </div>
            <div className="navbar-right">
                {user ? (
                    <div className='navbar-button'>
                        <Link to={`/@/${user.username}`} className='navbar-button'>{user.username}</Link>
                    </div>
                ) : (
                    <div className='navbar-button'>
                        <button className='navbar-button' onClick={() => navigate('/signup')}>SIGN IN</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Navbar;
