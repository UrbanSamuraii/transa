import { useState, useEffect } from "react";
import '../conversations/GlobalConversations.css'
import axios from 'axios';
import { useSocket } from '../../SocketContext';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

type Member = {
    username: string;
};

type MemberFormProps = {
    setShowModal: (show: boolean) => void;
};

export const UnblockUserForm: React.FC<MemberFormProps> = ({ setShowModal }) => {
    const [memberList, setMemberList] = useState<Member[]>([]);
    const { socket } = useSocket();

    useEffect(() => {
        const fetchMemberList = async () => {
            try {
                const response = await axios.post(`http://${server_adress}:3001/conversations/blocked_users_list`, null, { withCredentials: true });
                setMemberList(response.data);
            } catch (error) {
                console.error('Error fetching the list:', error);
            }
        };
        fetchMemberList();

        socket?.on('onBeingUnblockedorUnblocked', fetchMemberList);
        return () => {
            socket?.off('onBeingUnblockedorUnblocked', fetchMemberList);
        };
    }, [socket]);

    const unblockMember = async (username: string) => {
        try {
            const response = await axios.post(`http://${server_adress}:3001/conversations/unblock_user`,
                { userToUnblock: username },
                { withCredentials: true });
        } catch (error: any) {
            if (error.response && error.response.status === 403) {
                alert("Unauthorized: Please log in.");
            } else if (error.response && error.response.data && error.response.data.message) {
                alert(error.response.data.message);
            } else {
                console.error('Error un-blocking member:', error);
            }
        };
    };

    return (
        <div className="member-list-container">
            <h2>Blocked Users</h2>
            {memberList.length > 0 ? (
                <div className="member-list">
                    <ul>
                        {memberList.map((member) => (
                            <li key={member.username}>
                                <button
                                    className="username-button"
                                    onClick={() => unblockMember(member.username)}
                                >
                                    {member.username}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>You haven't block anyone yet.</p>
            )}
        </div>
    );
};
