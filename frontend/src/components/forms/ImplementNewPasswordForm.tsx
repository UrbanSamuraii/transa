import { useState } from "react";
import { useParams } from "react-router-dom";
import { ButtonCreateConv, InputContainerChat, InputFieldCCF, InputLabelChat } from '../../utils/styles';
import '../conversations/GlobalConversations.css'
import axios from 'axios';
import DOMPurify from 'dompurify';

const server_adress = process.env.REACT_APP_SERVER_ADRESS;

interface ConvDataInput {
    newPassword: string;
    disablePassword: boolean;
}

type SetUpNewPasswordFormProps = {
    setShowModal: (show: boolean) => void;
};

export const ImplementNewPasswordForm: React.FC<SetUpNewPasswordFormProps> = ({ setShowModal }) => {

    const [ConvDataInput, setConvDataInput] = useState<ConvDataInput>({
        newPassword: '',
        disablePassword: false,
    });

    const [formErrors, setFormErrors] = useState<Partial<ConvDataInput>>({});

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        let maxCharacterLimit;
        maxCharacterLimit = 15;
        if (value.length > maxCharacterLimit) { return; }

        if (type === 'checkbox') {
            setConvDataInput((prevData) => ({
                ...prevData,
                [name]: checked,
            }));

            if (checked) {
                handleDisablePassword();
            }
        } else {
            setConvDataInput((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }

        setFormErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    };

    const handleToggleDisablePassword = () => {
        setConvDataInput(prevData => ({
            ...prevData,
            disablePassword: !prevData.disablePassword
        }));
    };

    const conversationId = useParams().id;

    const handleNewPasswordConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<ConvDataInput> = {};
        if (!ConvDataInput.newPassword) {
            newErrors.newPassword = 'New password is required';
        }
        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
        }
        else {
            try {
                const sanitizedConvDataInput = {
                    ...ConvDataInput,
                    newPassword: DOMPurify.sanitize(ConvDataInput.newPassword),
                    disablePassword: ConvDataInput.disablePassword
                };
                const response = await axios.post(`http://${server_adress}:3001/conversations/${conversationId}/set_newPassword`, sanitizedConvDataInput, {
                    withCredentials: true
                });
                if (response.status === 403) {
                    const customWarning = response.data.message;
                    alert(`Warning: ${customWarning}`);
                }
                setShowModal(false);
            } catch (error) {
                console.error('Setting up new password to conversation error:', error);
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

    const handleDisablePassword = async () => {
        try {
            const response = await axios.post(`http://${server_adress}:3001/conversations/${conversationId}/set_newPassword`, { newPassword: null },
                { withCredentials: true });
            //   console.log({ "RESPONSE_DISABLE_PASSWORD": response });
            if (response.status === 403) {
                const customWarning = response.data.message;
                alert(`Warning: ${customWarning}`);
            }
            setShowModal(false);
        } catch (error) {
            console.error('Error disabling password:', error);
        }
    };

    return (
        <form className="form-Create-Conversation" onSubmit={handleNewPasswordConversation}>
            <h2>New Password</h2>

            <div className="input-createConv-container">
                <InputContainerChat>
                    <InputLabelChat htmlFor="Conversation Name">
                        Enter new password
                    </InputLabelChat>
                    <InputFieldCCF
                        type="text" name="newPassword" value={ConvDataInput.newPassword} onChange={handleInputChange} maxLength={10}/>
                    {formErrors.newPassword && <div className="error-message">{formErrors.newPassword}</div>}
                </InputContainerChat>
            </div>

            <div className="button-createConv-container">
                <ButtonCreateConv type="submit" >submit</ButtonCreateConv>
            </div>
            <label className="toggler-wrapper style-1">
                <input
                    type="checkbox"
                    id="disablePasswordCheckbox"
                    name="disablePassword"
                    checked={ConvDataInput.disablePassword}
                    onChange={handleInputChange}
                />
                <div className="toggler-slider">
                    <div className="toggler-knob"></div>
                </div>
            </label>
            <h3 className="toggle-name">Disable Password</h3>

        </form>
    );
};
