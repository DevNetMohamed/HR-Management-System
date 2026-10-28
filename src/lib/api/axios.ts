import axios from 'axios';

// Centralized Axios instance
// Base URL is configured via environment variable NEXT_PUBLIC_API_BASE_URL
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mock-api.example.com/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: prepared for future backend authentication tokens
apiClient.interceptors.request.use(
  (config) => {
    // In future phases, attach authorization header:
    // const token = getAuthToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: graceful handling without silently swallowing errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log API errors for debugging without crashing the frontend
    console.error('[API Error]:', error?.response?.status, error?.message);
    return Promise.reject(error);
  }
);

export default apiClient;
