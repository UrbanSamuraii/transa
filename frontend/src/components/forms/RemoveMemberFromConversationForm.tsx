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

export const RemoveMemberFromConversationForm: React.FC<MemberInConversationFormProps> = ({ setShowModal }) => {
    const [memberList, setMemberList] = useState<Member[]>([]);
    const conversationId = useParams().id;
    const [refreshMemberList, setRefreshMemberList] = useState(false);
    const chatSocketContextData = useSocket();

    useEffect(() => {
        const fetchMemberList = async () => {
            try {
                const response = await axios.get(`http://${server_adress}:3001/conversations/${conversationId}/members`, {
                    withCredentials: true,
                });
                // console.log({"MEMBER LIST in the conversation": response});
                setMemberList(response.data);
            } catch (error) {
                console.error('Error fetching member list:', error);
            }
        };

        fetchMemberList();

        const socket = chatSocketContextData?.socket;
        socket?.on('changeInConversation', fetchMemberList);
        return () => {
                socket?.off('changeInConversation', fetchMemberList);};

    }, [refreshMemberList, chatSocketContextData]);

    const removeMember = async (username: string) => {
        try {
            const response = await axios.post(`http://${server_adress}:3001/conversations/${conversationId}/remove_member`,
                { memberToRemove: username },
                { withCredentials: true });
            setRefreshMemberList(!refreshMemberList);
            // console.log("USER SELECTED ", response)
        } catch (error: any) {
            if (error.response && error.response.status === 403) {
                alert("Unauthorized: Please log in.");
            } else if (error.response && error.response.data && error.response.data.message) {
                alert(error.response.data.message);
            } else {
                console.error('Error removing member:', error);
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
                                onClick={() => removeMember(member.username)}
                            >
                                {member.username}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        ) : (
            <p>This chat is as empty as your soul.</p>
        )}
        </div>
    );
};
