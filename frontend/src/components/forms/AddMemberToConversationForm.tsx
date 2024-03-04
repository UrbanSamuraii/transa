import { useState } from "react";
import { useParams } from "react-router-dom";
import { ButtonCreateConv, InputContainerChat, InputFieldCCF, InputLabelChat } from '../../utils/styles';
import '../conversations/GlobalConversations.css'
import axios from 'axios';
import  { AxiosError } from 'axios';
import DOMPurify from 'dompurify';
import { ErrorConversationMessageModal } from "../modals/ErrorConversationMessageModal";

interface ConvDataInput {
    userToAdd: string;
}

type AddMemberToConversationFormProps = {
    setShowModal: (show: boolean) => void;
};

export const AddMemberToConversationForm: React.FC<AddMemberToConversationFormProps> = ({ setShowModal }) => {

    const [ConvDataInput, setConvDataInput] = useState<ConvDataInput>({
        userToAdd: '',
    });

    const [formErrors, setFormErrors] = useState<Partial<ConvDataInput>>({});
    const [formMsgError, setFormMsgError] = useState<Partial<FormData>>({});
    const [customError, setCustomError] = useState<string>('');
    const [showModalError, setShowModalError] = useState<boolean>(false);

    const handleCustomAlertClose = () => {
        setCustomError('');
    };

    const handleShowModalError = () => {
        setShowModalError(true);
    };

    const handleCloseModalError = () => {
        setShowModalError(false);
    };

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
        if (!ConvDataInput.userToAdd) {
            newErrors.userToAdd = 'Username is required';
        }
        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
        }
        else {
            try {
                const server_adress = process.env.REACT_APP_SERVER_ADRESS;
                const sanitizedConvDataInput = {
                    ...ConvDataInput,
                    userToAdd: DOMPurify.sanitize(ConvDataInput.userToAdd),
                };
                const response = await axios.post(`http://${server_adress}:3001/conversations/${conversationId}/add_member`, sanitizedConvDataInput, {
                    withCredentials: true
                });
                if (response.status !== 403) {
                    setShowModal(false);
                }
            } catch (error) {
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
        }
    };

    return (
        <>
        {customError && showModalError && <ErrorConversationMessageModal setShowModalError={handleCloseModalError} errorMessage={customError} />}
        <form className="form-Create-Conversation" onSubmit={handleJoinConversation}>
            <h2>Add User to the chat</h2>

            <div className="input-createConv-container">
                <InputContainerChat>
                    <InputLabelChat htmlFor="Conversation Name">
                        Username or email
                    </InputLabelChat>
                        <InputFieldCCF
                            type="text" name="userToAdd" value={ConvDataInput.userToAdd} onChange={handleInputChange} maxLength={30}/>
                        {formErrors.userToAdd && <div className="error-message">{formErrors.userToAdd}</div>}
                </InputContainerChat>
            </div>

            <div className="button-createConv-container">
                <ButtonCreateConv type="submit" >Add User</ButtonCreateConv>
            </div>
        </form>
        </>
    );
};
