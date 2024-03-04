import axios, { AxiosRequestConfig } from 'axios';
const server_adress = process.env.REACT_APP_SERVER_ADRESS;

export async function getConversationsIdentified(id: any) {
    try {
        const API_URL = `http://${server_adress}:3001/messages`;
        const config: AxiosRequestConfig = { withCredentials: true };

        const response = await axios.get(`${API_URL}/${id}`, config);
        // if (response.status >= 400) {
        //     throw new Error('Conversation not found');
        // }
        return response.data;
    } catch (error) {
        throw new Error('Conversation not found');
    }
}