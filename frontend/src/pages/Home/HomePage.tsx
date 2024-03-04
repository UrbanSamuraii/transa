import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/hooks/useAuthHook';

const HomePage = () => {
    const { user } = useAuth(); // Destructure to get the user from useAuth
    const navigate = useNavigate();

    const handlePlayClick = () => {
        navigate('/select-mode');
    };

    const handleSignUpClick = () => {
        navigate('/signup');
    };

    if (!user) {
        return (
            <div className="homepage">
                <div className='content'>
                    <button className="text" data-text='play' onClick={handleSignUpClick}>play</button>
                </div>
            </div>
        );
    }

    return (
        <div className="homepage">
            <div className='content'>
                <button className="text" data-text='Play' onClick={handlePlayClick}>Play</button>
            </div>
        </div>
    );
};

export default HomePage;
