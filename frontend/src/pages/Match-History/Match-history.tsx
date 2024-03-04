import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './MatchHistory.css';

type Match = {
    id: number;
    createdAt: string;
    gameMode: string;
    winner: { username: string };
    loser: { username: string };
    eloChangeWinner: number;
    eloChangeLoser: number;
};

function MatchHistory() {
    const { username } = useParams<{ username: string }>();
    const [matches, setMatches] = useState<Match[]>([]);

    useEffect(() => {
        const fetchMatchHistory = async () => {
            try {
                const response = await fetch(`http://${process.env.REACT_APP_SERVER_ADRESS}:3001/auth/match-history/${username}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await response.json();
                if (response.ok) {
                    // console.log(data);
                    setMatches(data);
                } else {
                    console.error('Failed to fetch match history:', data.error);
                }
            } catch (error) {
                console.error('Error fetching match history:', error);
            }
        };

        if (username) {
            fetchMatchHistory();
        }
    }, [username]);

    return (
        <div className='match-history-background'>
            <h1>{username}'s Match History</h1>
            <div className="match-history-container">
                <table className="match-history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Game Mode</th>
                            <th>Winner</th>
                            <th>Loser</th>
                            <th>ELO Change (Winner/Loser)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches.map(match => (
                            <tr key={match.id}>
                                <td>{new Date(match.createdAt).toLocaleDateString()}</td>
                                <td>{match.gameMode}</td>
                                <td>{match.winner ? match.winner.username : 'No winner yet'}</td>
                                <td>{match.loser ? match.loser.username : 'No loser yet'}</td>
                                <td>(+{match.eloChangeWinner}/{match.eloChangeLoser})</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MatchHistory;
