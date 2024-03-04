import React, { useEffect, useState } from 'react';
import './GlobalLeaderboard.css';

interface LeaderboardEntry {
    username: string;
    eloRating: number;
    totalGamesWon: number;
    totalGamesLost: number;
    winPercentage: number;
}
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

function GlobalLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const response = await fetch(`http://${server_adress}:3001/auth/leaderboard`);
            const data = await response.json();
            if (response.ok) {
                setLeaderboard(data);
            }
        };

        fetchLeaderboard();
    }, []);

    const filteredLeaderboard = leaderboard.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className='leaderboard-background'>
            <h1>Global Leaderboard</h1>
            <div className='search-input-container'>
                <input
                    className="search-input"
                    placeholder="Search by username..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                /></div>
                <div className='leaderboard-container'>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Username</th>
                            <th>ELO Rating</th>
                            <th>Wins</th>
                            <th>Losses</th>
                            <th>Win Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeaderboard.map((user, index) => (
                            <tr key={user.username}>
                                <td>{index + 1}</td>
                                <td>{user.username}</td>
                                <td>{user.eloRating}</td>
                                <td>{user.totalGamesWon}</td>
                                <td>{user.totalGamesLost}</td>
                                <td>{user.winPercentage}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default GlobalLeaderboard;
