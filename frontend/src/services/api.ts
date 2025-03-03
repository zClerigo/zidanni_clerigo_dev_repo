import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

// Add a stub authentication token to all requests
apiClient.interceptors.request.use(async (config) => {
  const stubToken = 'stub_token_123';
  config.headers.Authorization = `Bearer ${stubToken}`;
  return config;
});

// Example API call using the configured axios instance
export const fetchProtectedData = async () => {
  try {
    const response = await apiClient.get('/protected-endpoint/');
    return response.data;
  } catch (error) {
    console.error('Error fetching protected data:', error);
    throw error;
  }
};

export default apiClient;