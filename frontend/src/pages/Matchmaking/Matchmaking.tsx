import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Matchmaking.css';
import { useSocket } from '../../SocketContext';

function Matchmaking() {
    const { socket } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const matchFoundRef = useRef(false);
    const [ongoingGameId, setOngoingGameId] = useState(null);
    const [isGameStatusChecked, setIsGameStatusChecked] = useState(false);
    const isGameStatusCheckedRef = useRef(isGameStatusChecked);
    const ongoingGameIdRef = useRef(ongoingGameId);
    const { gameMode, champion } = location.state || { gameMode: 'classic', champion: null };

    useEffect(() => {
        if (!socket) {
            console.log('No socket provided in Matchmaking page');
            return;
        }

        const handleGameStatusResponse = (data: any) => {
            socket.off('gameStatusResponse');
            if (data.inGame) {
                setOngoingGameId(data.gameId);
                ongoingGameIdRef.current = data.gameId;
                navigate('/select-mode'); // Redirect to select modes page if already in a game
            } else {
                console.log(`Emitting enterMatchmaking for ${gameMode} mode`);
                socket.emit('enterMatchmaking', { gameMode, championId: champion?.id });
                socket.on('matchFound', handleMatchFound);
            }
            setIsGameStatusChecked(true);
            isGameStatusCheckedRef.current = true;
        };

        const handleMatchFound = (data: any) => {
            console.log('Match found!', data);
            const gameModePath = data.gameMode === 'powerpong' ? '/powerpong/' : '/classic/';
            navigate(`${gameModePath}${data.gameId}`);
            matchFoundRef.current = true;
        };

        socket.emit('checkGameStatus');
        socket.on('gameStatusResponse', handleGameStatusResponse);

        return () => {
            if (!matchFoundRef.current && ongoingGameIdRef.current == null && isGameStatusCheckedRef.current) {
                socket.emit('leaveMatchmaking');
            }
        };
    }, [socket, gameMode, champion?.id, navigate]);

    return (
        <div className="background">
            <div className="container">
                <div className="ball"></div>
                <div className="ball"></div>
                <div className="ball"></div>
                <div className="shadow"></div>
                <div className="shadow"></div>
                <div className="shadow"></div>
                <div className="searching-text">Searching for a game...</div>
            </div>
        </div>
    );
}

export default Matchmaking;
