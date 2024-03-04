import { useState } from "react";
import { ButtonCreateConv, InputContainerChat, InputFieldCCF, InputLabelChat } from '../../utils/styles';
import '../conversations/GlobalConversations.css'
import axios from 'axios';
import DOMPurify from 'dompurify';

const server_adress = process.env.REACT_APP_SERVER_ADRESS;

interface ConvDataInput {
    password: string;
    convId: number | null;
}

type CheckPasswordFormProps = {
    setShowModal: (show: boolean) => void;
    conversationId: number | null;
};

export const CheckPasswordForm: React.FC<CheckPasswordFormProps> = ({ setShowModal, conversationId }) => {

    const [ConvDataInput, setConvDataInput] = useState<ConvDataInput>({
        password: '',
        convId: conversationId,
    });

    const [formErrors, setFormErrors] = useState<Partial<ConvDataInput>>({});

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        let maxCharacterLimit;
        maxCharacterLimit = 10;
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

    const handleVerifyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<ConvDataInput> = {};
        if (!ConvDataInput.password) {
            newErrors.password = 'Password is required';
        }
        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
        }
        else {
            try {
                const sanitizedConvDataInput = {
                    ...ConvDataInput,
                    password: DOMPurify.sanitize(ConvDataInput.password),
                    convId: ConvDataInput.convId
                };
                const response = await axios.post(`http://${server_adress}:3001/conversations/validate_password`, sanitizedConvDataInput, {
                    withCredentials: true
                });
                setShowModal(false);
                if (response.status === 403) {
                    const customWarning = response.data.message;
                    alert(`Warning: ${customWarning}`);
                }
            } catch (error) {
                console.error('Verify password conversation error:', error);
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
        <form className="form-Create-Conversation" onSubmit={handleVerifyPassword}>
            <h2>Password Verification</h2>

            <div className="input-createConv-container">
                <InputContainerChat>
                    <InputLabelChat htmlFor="Conversation Name">
                        Please enter the Password
                    </InputLabelChat>
                    <InputFieldCCF
                        type="text" name="password" value={ConvDataInput.password} onChange={handleInputChange} maxLength={10}/>
                    {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                </InputContainerChat>
            </div>


            <div className="button-createConv-container">
                <ButtonCreateConv type="submit" >Submit</ButtonCreateConv>
            </div>

        </form>
    );
};
