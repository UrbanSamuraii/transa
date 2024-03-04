import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from 'axios';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

type LeavingConversationFormProps = {
    setShowModal: (show: boolean) => void;
};

export const LeavingConversationForm: React.FC<LeavingConversationFormProps> = ({ setShowModal }) => {

    const conversationId = useParams().id;

    const LeavingTheConv = async () => {
        // console.log("LEAVING THE ROOM");
        try {
            await axios.get(`http://${server_adress}:3001/conversations/${conversationId}/leave_conversation`,
                { withCredentials: true });
        } catch (error) {
            console.error('Error when leaving the conversation:', error);

        }
    };

    return (
        <div className="leave-confirmation-container">
            <h2>Are you sure you want to leave this chat?</h2>
            <div className="button-container">
                <button className="yes-button" onClick={() => LeavingTheConv()}>Yes</button>
                <button className="no-button" onClick={() => setShowModal(false)}>No</button>
            </div>
        </div>
    );
};
