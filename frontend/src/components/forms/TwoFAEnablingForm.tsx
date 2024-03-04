import React, { useState } from 'react';
import { Button2FA, Text2FA } from '../../utils/styles';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GlobalForms.css';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

export const TwoFAEnablingForm = () => {

    const navigate = useNavigate();

    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [authenticationCode, setAuthenticationCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSetupClick = async () => {
        try {
            console.log("LETS SET UP 2FA");
            const response = await axios.post(`http://${server_adress}:3001/auth/2fa/generate`, null, {
                withCredentials: true,
            });
            const updatedUser = response.data.user;
            const qrCodeUrl = response.data.qrCodeUrl;
            if (updatedUser) {
                setQrCodeUrl(qrCodeUrl);
            } else { console.error('User not updated in response.'); }
        } catch (error) {
            console.error('Error setting up 2FA:', error);
        }
    }

    const handleEnableClick = async () => {
        try {
            console.log({ "Enabling code": authenticationCode });
            const response = await axios.post(`http://${server_adress}:3001/auth/2fa/turn_on`, { twoFactorAuthenticationCode: authenticationCode }, {
                withCredentials: true,
            });
            console.log({ "RESPONSE FROM ENABLING 2FA": response });
            navigate('/');
        }
        catch (error) {
            console.error('Error enabling up 2FA:', error);
        }
    }

    return (
        <form>
            <div className="TwoFA-content-container">
                <h1>Two-Factor Authentication Setup</h1>
                {error && <div className="error-message">{error}</div>} {/* Display error message */}
                {!qrCodeUrl && (
                    <button className='start-2FA-setup' type="button" onClick={handleSetupClick}>Start 2FA Setup</button>
                )}
                {qrCodeUrl && (
                    <div className="TwoFA-content-container-QR">
                        <img src={qrCodeUrl} alt="QR Code" />
                        <div className='auth-code-container'>
                        <input
                            className='auth-code'
                            type="text"
                            placeholder="Authentication Code"
                            value={authenticationCode}
                            onChange={(e) => setAuthenticationCode(e.target.value)} /></div>
                        <button className='start-2FA-setup' type="button" onClick={handleEnableClick}>Enable 2FA</button>
                    </div>
                )}
            </div>
        </form>
    );
};
