import React from 'react';
import { Route, Navigate } from 'react-router-dom';

interface CustomRedirectionFrom42RouteProps {
    cameFromSignup42: boolean;
    path: string;
}

const CustomRedirectionFrom42Route: React.FC<CustomRedirectionFrom42RouteProps> = ({
    cameFromSignup42,
    ...props
}) => {
    if (cameFromSignup42 && props.path === '/') {
        const server_adress = process.env.REACT_APP_SERVER_ADRESS;
        const s_adress = `http://${server_adress}:3000`;
        return <Navigate to={s_adress} />;
    } else {
        return <Route {...props} />;
    }
};

export default CustomRedirectionFrom42Route;

