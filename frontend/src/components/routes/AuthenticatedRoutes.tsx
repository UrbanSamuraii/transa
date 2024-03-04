import React, { FC } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/hooks/useAuthHook';

export const AuthenticatedRoute: FC<React.PropsWithChildren> = ({ children }) => {

    const location = useLocation();
    const { loading, user } = useAuth();

    if (loading) { return <div>loading</div>; }
    if (user) { return <>{children}</>; }
    return <Navigate to="/signup" state={{ from: location }} replace />;
};