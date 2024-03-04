import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button, Button42, InputContainer, InputField, InputLabel } from '../../utils/styles';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GlobalForms.css';
import { useSocket } from './../../SocketContext';
import { ErrorMessageModal } from '../modals/ErrorMessageModal';
import DOMPurify from 'dompurify';

const server_adress = process.env.REACT_APP_SERVER_ADRESS;

interface FormData {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    password: string;
}

export const RegisterForm = () => {

    const navigate = useNavigate();
    const { socket } = useSocket();  // Get the socket from context

    const [formData, setFormData] = useState<FormData>({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
    });

    const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
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
        switch (name) {
            case 'email':
                maxCharacterLimit = 30;
                break;
            case 'username':
                maxCharacterLimit = 10;
                break;
            default:
                maxCharacterLimit = 15;
        }
        if (value.length > maxCharacterLimit) { return; }

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        setFormErrors((prevErrors) => ({
            ...prevErrors,
            [name]: '',
        }));
    };

    async function handleSignUp42Click() {
        try {
            window.location.href = `http://${server_adress}:3001/auth/signup42`;
        }
        catch (error) {
            console.error('Sign up request error:', error);
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<FormData> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        }
        if (!formData.username) {
            newErrors.username = 'Username is required';
        }
        if (/[.,;!?'"<>]|\s/.test(formData.username)) {
            newErrors.username = 'Username cannot contain spaces or punctuation marks';
        }
        if (!formData.first_name) {
            newErrors.first_name = 'First name is required';
        }
        if (/[.,;!?'"<>]|\s/.test(formData.first_name)) {
            newErrors.first_name = 'First name cannot contain spaces or punctuation marks';
        }
        if (!formData.last_name) {
            newErrors.last_name = 'Last name is required';
        }
        if (/[.,;!?'"<>]/.test(formData.last_name)) {
            newErrors.last_name = 'Last name cannot contain spaces or punctuation marks';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
        }
        else {
            try {
                const sanitizedFormData = {
                    ...formData,
                    email: DOMPurify.sanitize(formData.email),
                    username: DOMPurify.sanitize(formData.username),
                    first_name: DOMPurify.sanitize(formData.first_name),
                    last_name: DOMPurify.sanitize(formData.last_name),
                    password: DOMPurify.sanitize(formData.password),
                };
                const response = await axios.post(`http://${server_adress}:3001/auth/signup`, sanitizedFormData,
                    { withCredentials: true });
                if (socket) {
                    socket.disconnect()
                }
                navigate('/');
            } catch (error) {
                console.log("ERROR RegisterForm!");
                if (axios.isAxiosError(error)) {
                    if (error.response && error.response.data) {
                        const receivedCustomError: string = error.response.data.message;
                        console.log("Error when register: ", receivedCustomError);
                        if (receivedCustomError) {
                            setCustomError(receivedCustomError);
                            handleShowModalError();
                        }
                    }
                }
            }
        }
    };

    return (
        <>
        {customError && showModalError && <ErrorMessageModal setShowModalError={handleCloseModalError} errorMessage={customError} />}
        <div className="app-container">
            <head>
                <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'></link>
            </head>

            <body className='some-class'>
                <div className='animation-box-register'>
                    <span className='borderline-register'></span>
                    <form className="form-container" onSubmit={handleSignUp}>
                        <h1 className='zagolovok'>Create Account</h1>
                        <section className="nameFieldRow">
                            <InputContainer>
                                <InputField className='input'
                                    placeholder="email" type="email" name="email" value={formData.email} onChange={handleInputChange} maxLength={30} />
                                {formErrors.email && <div className="error-message">{formErrors.email}</div>}
                                <i className='bx bx-user'></i>
                            </InputContainer>
                        </section>

                        <section className="nameFieldRow">
                            <div className="nameFieldContainerFirst">
                                <InputContainer>
                                    <InputField className='input'
                                        placeholder="first name" type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} maxLength={15}
                                    />
                                    {formErrors.first_name && <div className="error-message">{formErrors.first_name}</div>}
                                </InputContainer>
                            </div>
                            <div className="nameFieldContainerLast">
                                <InputContainer>
                                    <InputField className='input'
                                        placeholder="last name" type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} maxLength={15}
                                    />
                                    {formErrors.last_name && <div className="error-message">{formErrors.last_name}</div>}
                                </InputContainer>
                            </div>
                            <div className="nameFieldContainerFirst">
                                <InputContainer>
                                    <InputField className='input'
                                        placeholder="username" type="text" name="username" value={formData.username} onChange={handleInputChange} maxLength={10}
                                    />
                                    {formErrors.username && <div className="error-message">{formErrors.username}</div>}
                                </InputContainer>
                            </div>
                        </section>
                        <section className="nameFieldRow">
                            <div className="nameFieldContainerLast">
                                <InputContainer>
                                    <InputField
                                        placeholder="password" type="password" name="password" value={formData.password} onChange={handleInputChange} maxLength={15} />
                                    {formErrors.password && <div className="error-message">{formErrors.password}</div>}
                                    <i className='bx bxs-lock-alt'></i>
                                </InputContainer>
                            </div>
                        </section>

                        <div className="button-login-container">
                            <Button type="submit" >Create My Account</Button>
                        </div>

                        <div className="existingUserOrNot">
                            <span>Already have an account? </span>
                            <Link to="/Login">Login</Link>
                        </div>

                        <div className='button42'>
                            <Button42 onClick={handleSignUp42Click}></Button42>
                        </div>
                    </form>
                </div>
            </body>
        </div>
        </>
    );
};
