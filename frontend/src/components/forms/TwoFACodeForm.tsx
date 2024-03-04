import React, { useState, useEffect } from 'react';
import { Button2FA, Text2FA } from '../../utils/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './GlobalForms.css';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

export const TwoFACodeForm = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const [TwoFACode, setAuthenticationCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [user, setUser] = useState({ email: '' });
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const userEmail = searchParams.get('userEmail');
        if (userEmail) {
            setUser({ email: userEmail });
        }
    }, [location.search]);

    const handleLogin42FAClick = async () => {
        try {
            const response = await axios.post(`http://${server_adress}:3001/auth/2fa/login`, { two_factor_athentication_password: TwoFACode, email: user.email }, {
                withCredentials: true,
            });
            navigate('/');
        }
        catch (error) {
            console.error('Error login with 2FA:', error);
        }
    }

    return (
        <form>
            <div className="TwoFA-content-container">
                <Text2FA>Please enter your Two-Factor Authentication code</Text2FA>
                <input
                    type="text"
                    placeholder="Authentication Code"
                    value={TwoFACode}
                    onChange={(e) => setAuthenticationCode(e.target.value)}
                />
            </div>
            <Button2FA type="button" onClick={handleLogin42FAClick}>Login</Button2FA>
            {error && <div className="error-message">{error}</div>} {/* Display error message */}
        </form>
    );
}
