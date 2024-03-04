import axios, { AxiosRequestConfig } from 'axios';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

export async function getConversations() {
    try {
        const API_URL = `http://${server_adress}:3001`;
        const config: AxiosRequestConfig = { withCredentials: true };

        const response = await axios.get(`${API_URL}/conversations`, config);
        console.log({ "RESPONSE FROM AXIOS.GET": response.data });
        return response.data;
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return { conversations: [] }; // Return an empty array in case of an error
    }
}
