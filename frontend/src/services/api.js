import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
api.interceptors.request.use(
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

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized responses
      if (error.response.status === 401) {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to signin page if not already there
        if (!window.location.pathname.includes('/signin')) {
          window.location.href = '/signin';
        }
      }
      
      // Handle 403 Forbidden responses
      if (error.response.status === 403) {
        if (error.response.data.needsVerification) {
          window.location.href = '/verify-email';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
