import { useState } from "react";
import { ButtonCreateConv, InputContainerChat, InputFieldCCF, InputLabelChat } from '../../utils/styles';
import '../conversations/GlobalConversations.css'
import axios from 'axios';
import  { AxiosError } from 'axios';
import DOMPurify from 'dompurify';
import { ErrorConversationMessageModal } from "../modals/ErrorConversationMessageModal";
import { useNavigate } from "react-router-dom";
import { CheckPasswordModal } from "../modals/CheckPasswordModal";
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

interface ConvDataInput {
    conversationName: string;
}

type JoinConversationFormProps = {
    setShowModal: (show: boolean) => void;
};

export const JoinConversationForm: React.FC<JoinConversationFormProps> = ({ setShowModal }) => {

    const [showCheckPasswordModal, setShowCheckPasswordModal] = useState(false);
    const [convId, setConversationId] = useState<number | null>(null);
    const [ConvDataInput, setConvDataInput] = useState<ConvDataInput>({
        conversationName: '',
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
        maxCharacterLimit = 15;
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

    const navigate = useNavigate();

    const handleJoinConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<ConvDataInput> = {};
        if (!ConvDataInput.conversationName) {
            newErrors.conversationName = 'Conversation Name is required';
        }
        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
        }
        else {
            try {
                const sanitizedConvDataInput = {
                    ...ConvDataInput,
                    conversationName: DOMPurify.sanitize(ConvDataInput.conversationName),
                };
                const response = await axios.post(`http://${server_adress}:3001/conversations/join`, sanitizedConvDataInput, {
                    withCredentials: true
                });
                // if (response.status === 403) {
                //     const customWarning = response.data.message;
                //     alert(`Warning: ${customWarning}`);
                // }
                if (response.status === 202) {
                    const id = response.data.conversationId;
                    setConversationId(id);
                    setShowCheckPasswordModal(true);
                }
                else {
                    const conversationId = response.data.conversationId;
                    setShowModal(false);
                    navigate(`channel/${conversationId}`);
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
            {showCheckPasswordModal && convId !== null && (<CheckPasswordModal
                setShowModal={() => {
                    setShowCheckPasswordModal(false);
                    setShowModal(false);
                }} convId={convId} />)}
            <form className="form-Create-Conversation" onSubmit={handleJoinConversation}>
                <h2>Join a chat</h2>

                <div className="input-createConv-container">
                    <InputContainerChat>
                        <InputLabelChat htmlFor="Conversation Name">
                            chat name
                        </InputLabelChat>
                            <InputFieldCCF
                                type="text" name="conversationName" value={ConvDataInput.conversationName} onChange={handleInputChange} maxLength={15}/>
                            {formErrors.conversationName && <div className="error-message">{formErrors.conversationName}</div>}
                    </InputContainerChat>
                </div>


                <div className="button-createConv-container">
                    <ButtonCreateConv type="submit" >Join chat</ButtonCreateConv>
                </div>
            </form>
        </>
    );
};
