import axios from 'axios';
import config from '../config';

const API = axios.create({
    baseURL: `${config.apiUrl}/api/`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para agregar el token a las peticiones
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default API; 