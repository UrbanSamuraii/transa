import React, { useState } from 'react';
import { Button2FA, Text2FA } from '../../utils/styles';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GlobalForms.css';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

export const TwoFADisablingForm = () => {

    const navigate = useNavigate();

    const [error, setError] = useState<string | null>(null);

    const handleDisableClick = async () => {
        try {
            const response = await axios.post(`http://${server_adress}:3001/auth/2fa/turn_off`, null, {
                withCredentials: true,
            });
            console.log({ "RESPONSE FROM DISABLING 2FA": response });
            navigate('/');
        }
        catch (error) {
            console.error('Error disabling up 2FA:', error);
        }
    }

    return (
        <form>
            <div className="TwoFA-off-container">
                <h1>Are you sure you want to disable Two-Factor Authentication?</h1>
                <button className='Disable-2FA' type="button" onClick={handleDisableClick}>Yes, Disable 2FA</button>
                {error && <div className="error-message">{error}</div>} {/* Display error message */}
            </div>
        </form>
    );
}
