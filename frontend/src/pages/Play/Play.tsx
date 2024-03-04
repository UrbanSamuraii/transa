import React from 'react';

interface PlayProps {
    onPlayClick: () => void;
    onSignOutClick: () => void;
    onTurnOn2FA: () => void;
    onTurnOff2FA: () => void;
    onConversations: () => void;

}

const Play: React.FC<PlayProps> = ({ onPlayClick, onSignOutClick, onTurnOn2FA, onTurnOff2FA, onConversations}) => {
    return (
        <div>
            <button className="play-button" onClick={onPlayClick}>PLAY</button>
            <button className="signout-button" onClick={onSignOutClick}>SIGN OUT</button>
            <button className="turn-on-2fa-button" onClick={onTurnOn2FA}>Turn On 2FA authentication</button>
            <button className="disable-2fa-button" onClick={onTurnOff2FA}>Disable 2FA</button> 
            <button className="conversations-button" onClick={onConversations}>Conversations</button> 
        </div>
    );
}

export default Play;

