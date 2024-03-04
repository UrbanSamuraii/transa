import { useState } from "react";
import { useParams } from "react-router-dom";
import { ButtonCreateConv, InputContainerChat, InputFieldCCF, InputLabelChat } from '../../utils/styles';
import '../conversations/GlobalConversations.css'
import axios from 'axios';
import DOMPurify from 'dompurify';

const server_adress = process.env.REACT_APP_SERVER_ADRESS;

interface ConvDataInput {
    userToBan: string;
}

type BanUserFromConversationFormProps = {
    setShowModal: (show: boolean) => void;
};

export const BanUserFromConversationForm: React.FC<BanUserFromConversationFormProps> = ({ setShowModal }) => {

    const [ConvDataInput, setConvDataInput] = useState<ConvDataInput>({
        userToBan: '',
    });

    const [formErrors, setFormErrors] = useState<Partial<ConvDataInput>>({});

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        let maxCharacterLimit;
        maxCharacterLimit = 30;
        if (value.length > maxCharacterLimit) { return; }
        setConvDataInput((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        setFormErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    };

    const conversationId = useParams().id;

    const handleJoinConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<ConvDataInput> = {};
        if (!ConvDataInput.userToBan) {
            newErrors.userToBan = 'Username is required';
        }
        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
        }
        else {
            try {
                const sanitizedConvDataInput = {
                    ...ConvDataInput,
                    userToBan: DOMPurify.sanitize(ConvDataInput.userToBan),
                };
                const response = await axios.post(`http://${server_adress}:3001/conversations/${conversationId}/ban_user`, sanitizedConvDataInput, {
                    withCredentials: true
                });
                if (response.status === 403) {
                    const customWarning = response.data.message;
                    alert(`Warning: ${customWarning}`);
                }
                setShowModal(false);
            } catch (error) {
                console.error('Banning user to conversation error:', error);
                if (axios.isAxiosError(error)) {
                    if (error.response && error.response.data) {
                        const customError = error.response.data.message;
                        if (customError) {
                            alert(`Error: ${customError}`);
                        }
                    }
                }
            }
        }
    };

    return (
        <form className="form-Create-Conversation" onSubmit={handleJoinConversation}>
            <h2>Ban User from the chat</h2>

            <div className="input-createConv-container">
                <InputContainerChat>
                    <InputLabelChat htmlFor="Conversation Name">
                        Username or email
                    </InputLabelChat>
                        <InputFieldCCF
                            type="text" name="userToBan" value={ConvDataInput.userToBan} onChange={handleInputChange} maxLength={30}/>
                        {formErrors.userToBan && <div className="error-message">{formErrors.userToBan}</div>}
                </InputContainerChat>
            </div>


            <div className="button-createConv-container">
                <ButtonCreateConv type="submit" >Ban User</ButtonCreateConv>
            </div>

        </form>
    );
};
