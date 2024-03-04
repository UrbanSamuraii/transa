import { useState } from "react";
import { ButtonCreateConv, InputContainerChat, InputFieldCCF, InputLabelChat } from '../../utils/styles';
import '../conversations/GlobalConversations.css'
import axios from 'axios';
import { BlockUserModal } from "../modals/BlockUserModal";
import DOMPurify from 'dompurify';
import  { AxiosError } from 'axios';
import { ErrorConversationMessageModal } from "../modals/ErrorConversationMessageModal";

const server_adress = process.env.REACT_APP_SERVER_ADRESS;

interface ConvDataInput {
    userName: string;
}

type BlockUserFormProps = {
    setShowModal: (show: boolean) => void;
};

export const BlockUserForm: React.FC<BlockUserFormProps> = ({ setShowModal }) => {

    const [showCheckPasswordModal, setShowCheckPasswordModal] = useState(false);
    const [convId, setConversationId] = useState<number | null>(null);


    const [ConvDataInput, setConvDataInput] = useState<ConvDataInput>({
        userName: '',
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

    const handleBlockUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<ConvDataInput> = {};
        if (!ConvDataInput.userName) {
            newErrors.userName = 'Username or email is required';
        }
        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
        }
        else {
            try {
                const sanitizedConvDataInput = {
                    ...ConvDataInput,
                    userName: DOMPurify.sanitize(ConvDataInput.userName),
                };
                const response = await axios.post(`http://${server_adress}:3001/conversations/block_user`, sanitizedConvDataInput, {
                    withCredentials: true
                });
                setShowModal(false);
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
            {showCheckPasswordModal && convId !== null && (<BlockUserModal
                setShowModal={() => {
                    setShowModal(false);
                }} />)}
            <form className="form-Create-Conversation" onSubmit={handleBlockUser}>
                <h2>Block a user</h2>

                <div className="input-createConv-container">
                    <InputContainerChat>
                        <InputLabelChat htmlFor="Conversation Name">
                            Username or email
                        </InputLabelChat>``
                            <InputFieldCCF
                                type="text" name="userName" value={ConvDataInput.userName} onChange={handleInputChange} maxLength={30}/>
                            {formErrors.userName && <div className="error-message">{formErrors.userName}</div>}
                    </InputContainerChat>
                </div>
                <div className="button-createConv-container">
                    <ButtonCreateConv type="submit" >Block User</ButtonCreateConv>
                </div>
            </form>
        </>
    );
};
