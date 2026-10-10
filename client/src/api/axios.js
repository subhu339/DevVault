import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devvault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('devvault_token');
      localStorage.removeItem('devvault_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
