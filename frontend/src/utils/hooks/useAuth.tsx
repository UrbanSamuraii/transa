import { useEffect, useState } from "react";
import axios, { AxiosRequestConfig } from 'axios';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

export function useAuth() {
    const [user, setUser] = useState<any>();
    const [loading, setLoading] = useState(true);

    const API_URL = `http://${server_adress}:3001`;
    const config: AxiosRequestConfig = { withCredentials: true };

    useEffect(() => {
        axios.get(`${API_URL}/auth/me`, config)
            .then(({ data }) => {
                // console.log({ "DATA from getAuthUser": data });
                setUser(data);
                setTimeout(() => setLoading(false), 1000);
            })
            .catch((err) => {
                setTimeout(() => setLoading(false), 1000);
            });
    }, []);

    return { user, loading };
}
