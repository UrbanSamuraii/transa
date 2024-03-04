import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import SquareGame from './pages/Game/SquareGame';
import SelectModePage from './pages/SelectMode/SelectModesPage';
import HomePage from './pages/Home/HomePage';
import { CSSProperties } from 'react';
import { Signup } from './pages/Signup';
import MatchHistory from './pages/Match-History/Match-history';
import Signout from './pages/Signout/Signout';
import { Login } from './pages/Login';
import { ConversationPage } from './pages/ConversationPage';
import { FriendsPage } from './pages/Friends/FriendsPage';
import { ConversationChannelPage } from './pages/ConversationChannelPage';
import { TwoFAEnablingPage } from './pages/TwoFAEnablingPage';
import { TwoFADisablingPage } from './pages/TwoFADisablingPage';
import { TwoFACodePage } from './pages/TwoFACodePage';
import Navbar from './components/Navbar/Navbar';
import Matchmaking from './pages/Matchmaking/Matchmaking';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound/NotFound';
import GlobalLeaderboard from './pages/Leaderboard/GlobalLeaderboard';
import { AuthProvider, useAuth } from './AuthContext';
import { OnlySocketProvider } from './SocketContext';
import PowerPongGame from './pages/Game/PowerPongGame';

const defaultBackgroundStyle = {
    background: '#1a1a1a',
};

interface ContentProps {
    setBackgroundStyle: React.Dispatch<React.SetStateAction<React.CSSProperties>>;
}

interface RouteBackgroundStyles {
    [key: string]: React.CSSProperties;
}

function App() {
    const [backgroundStyle, setBackgroundStyle] = useState<CSSProperties>(defaultBackgroundStyle);

    return (
        <Router>
            <AuthProvider>
                <OnlySocketProvider>
                    <div className="App" style={backgroundStyle}>
                        <Navbar />
                        <Content
                            setBackgroundStyle={setBackgroundStyle}
                        />
                    </div>
                </OnlySocketProvider>
            </AuthProvider>
        </Router>
    );
}

function Content({ setBackgroundStyle }: ContentProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const prevPathnameRef = useRef(location.pathname);
    const { user } = useAuth();

    useEffect(() => {
        const previousPathname = prevPathnameRef.current;

        console.log(previousPathname)
        console.log(location.pathname)

        prevPathnameRef.current = location.pathname;
    }, [location.pathname, prevPathnameRef, navigate]);

    function handlePlayClick() {
        navigate("/select-mode");
    }

    const TurnOn2FA = async () => {
        navigate('/2fa-enable')
    }

    const TurnOff2FA = async () => {
        navigate('/2fa-disable')
    }

    const handleSignoutClick = async () => {
        try {
            navigate('/signout');
        } catch (error) {
            console.error('Signout failed:', error);
            navigate('/error');
        }
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<HomePage />} />
            {/* Protected routes */}
            {user && (
                <>
                    <Route path="/classic/:id" element={<SquareGame />} />
                    <Route path="/powerpong/:id" element={<PowerPongGame />} />
                    <Route path="/ConversationPage" element={<ConversationPage />} >
                        <Route path="channel/:id" element={<ConversationChannelPage />} />
                    </Route>
                    <Route path="/Friends" element={<FriendsPage />} />
                    <Route path="/FortyTwoFA" element={<TwoFACodePage />} />
                    <Route path="/select-mode" element={<SelectModePage />} />
                    <Route path="/2fa-enable" element={<TwoFAEnablingPage />} />
                    <Route path="/2fa-disable" element={<TwoFADisablingPage />} />
                    <Route path="/@/:username" element={<Profile />} />
                    <Route path="/@/:username/match-history" element={<MatchHistory />} />
                    <Route path="/leaderboard" element={<GlobalLeaderboard />} />
                    <Route path="/matchmaking" element={<Matchmaking />} />
                    <Route path="/signout" element={<Signout />} />
                </>
            )}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );

}

export default App;
