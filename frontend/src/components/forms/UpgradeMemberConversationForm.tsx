import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from 'axios';
import { useSocket } from '../../SocketContext';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

type Member = {
    username: string;
};

type MemberInConversationFormProps = {
    setShowModal: (show: boolean) => void;
};

export const UpgradeMemberInConversationForm: React.FC<MemberInConversationFormProps> = ({ setShowModal }) => {
    const [memberList, setMemberList] = useState<Member[]>([]);
    const conversationId = useParams().id;
    const { socket } = useSocket();

    useEffect(() => {
        const fetchMemberList = async () => {
            try {
                const response = await axios.get(`http://${server_adress}:3001/conversations/${conversationId}/not_admin_members`, {
                    withCredentials: true,
                });
                setMemberList(response.data);
            } catch (error) {
                console.error('Error fetching member list:', error);
            }
        };

        fetchMemberList();

        socket?.on('onUpdateAdminStatus', fetchMemberList);
        return () => {
            socket?.off('onUpdateAdminStatus', fetchMemberList);
        };
    }, [socket]);

    const upgradeMemberToAdmin = async (username: string) => {
        try {
            await axios.post(`http://${server_adress}:3001/conversations/${conversationId}/update_member_to_admin`,
                { userToUpgrade: username },
                { withCredentials: true });
        } catch (error) {
            console.error('Error upgrading member to admin:', error);
        }
    };

    return (
        <div className="member-list-container">
            <h2>Member List</h2>
            {memberList.length > 0 ? (
            <div className="member-list">
                <ul>
                    {memberList.map((member) => (
                        <li key={member.username}>
                            <button
                                className="username-button"
                                onClick={() => upgradeMemberToAdmin(member.username)}
                            >
                                {member.username}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            ) : (
            <p>There are no-one to promote.</p>
        )}
        </div>
    );
};
