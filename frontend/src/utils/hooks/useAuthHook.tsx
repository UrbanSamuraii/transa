import { useEffect, useState, useCallback, useMemo } from "react";
import axios, { AxiosRequestConfig } from 'axios';
const server_address = process.env.REACT_APP_SERVER_ADRESS;
const API_URL = `http://${server_address}:3001`;

export function useAuth() {
    const [user, setUser] = useState<any>();
    const [loading, setLoading] = useState(true);

    const config = useMemo<AxiosRequestConfig>(() => ({
        withCredentials: true
    }), []);

    const checkAuthStatus = useCallback(() => {
        setLoading(true);
        axios.get(`${API_URL}/auth/me`, config)
            .then(({ data }) => {
                console.log({ "DATA from getAuthUser": data });
                setUser(data);
            })
            .catch((err) => {
                console.error('Auth check failed:', err);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, [config]);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    return { user, loading, checkAuthStatus };
}
