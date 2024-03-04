import axios, { AxiosRequestConfig } from 'axios';

export async function getFriendsList() {
    try {
        const API_URL = `http://${process.env.REACT_APP_SERVER_ADRESS}:3001/users`;
        const config: AxiosRequestConfig = { withCredentials: true };

        const response = await axios.get(`${API_URL}/get_friends`, config);
        console.log({ "RESPONSE FROM AXIOS.GET FRIENDS LIST": response.data });
        return response.data;
    } catch (error) {
        console.error('Error fetching friends list:', error);
        return { friendsList: [] }; // Return an empty array in case of an error
    }
}