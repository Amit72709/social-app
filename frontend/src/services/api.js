import axios from 'axios';

// const api = axios.create({
//   baseURL: '',
//   headers: { 'Content-Type': 'application/json' }
// });


// api.js
const api = axios.create({
  baseURL: 'https://social-app-backend-k663.onrender.com', // Render backend
  headers: { 'Content-Type': 'application/json' }
});

// Automatically attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;