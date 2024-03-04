import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import '../conversations/GlobalConversations.css'
import axios from 'axios';
import { useSocket } from '../../SocketContext';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

type Member = {
    username: string;
};

type MemberInConversationFormProps = {
    setShowModal: (show: boolean) => void;
};

export const UnMuteMemberInConversationForm: React.FC<MemberInConversationFormProps> = ({ setShowModal }) => {
    const [memberList, setMemberList] = useState<Member[]>([]);
    const conversationId = useParams().id;
    const { socket } = useSocket();

    useEffect(() => {
        const fetchMemberList = async () => {
            try {
                const response = await axios.get(`http://${server_adress}:3001/conversations/${conversationId}/muted_members`, {
                    withCredentials: true,
                });
                setMemberList(response.data);
            } catch (error) {
                console.error('Error fetching member list:', error);
            }
        };

        fetchMemberList();

        socket?.on('onUnmuteMember', fetchMemberList);
        return () => {
            socket?.off('onUnmuteMember', fetchMemberList);
        };
    }, [socket]);

    const unMuteMember = async (username: string) => {
        try {
            const response = await axios.post(`http://${server_adress}:3001/conversations/${conversationId}/get_member_unmute`,
                { userToUnmute: username },
                { withCredentials: true });
            console.log("USER SELECTED ", response)
        } catch (error: any) {
            if (error.response && error.response.status === 403) {
                alert("Unauthorized: Please log in.");
            } else if (error.response && error.response.data && error.response.data.message) {
                alert(error.response.data.message);
            } else {
                console.error('Error un-muting member:', error);
            }
        };
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
                                onClick={() => unMuteMember(member.username)}
                            >
                                {member.username}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            ) : (
                <p>There is no-one to unmute.</p>
            )}
        </div>
    );
};
