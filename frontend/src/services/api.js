import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DEFAULT_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Cache for GET requests
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function for retrying failed requests
const retryRequest = async (error, retryCount = 0) => {
  const { config } = error;
  
  // Don't retry on client errors (4xx) or if max retries reached
  if (!config || 
      retryCount >= MAX_RETRIES || 
      (error.response?.status >= 400 && error.response?.status < 500)) {
    return Promise.reject(error);
  }

  // Exponential backoff with jitter
  const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
  await new Promise(resolve => setTimeout(resolve, delay));

  console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES}):`, config.url);
  return api.request(config);
};

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request headers:', config.headers);
    } else {
      console.warn('No token found in localStorage');
    }

    // Check cache for GET requests
    if (config.method === 'get' && !config.skipCache) {
      const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
      const cachedResponse = cache.get(cacheKey);
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
        return Promise.resolve(cachedResponse.data);
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors and caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET requests
    if (response.config.method === 'get' && !response.config.skipCache) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        originalError: error,
      });
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
      return Promise.reject({
        status: 408,
        message: 'Request timeout. Please try again.',
        originalError: error,
      });
    }

    // Handle rate limiting errors
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retryAfter || 3600;
      return Promise.reject({
        status: 429,
        message: error.response.data?.message || 'Too many requests. Please try again later.',
        retryAfter,
        originalError: error,
      });
    }

    // Don't retry client errors (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return Promise.reject({
        status: error.response.status,
        message: error.response.data?.message || 'Request failed.',
        data: error.response.data,
        originalError: error,
      });
    }

    // Retry server errors (5xx)
    if (error.config && !error.config.retryCount) {
      error.config.retryCount = 0;
      return retryRequest(error, error.config.retryCount);
    }

    if (error.config && error.config.retryCount < MAX_RETRIES) {
      error.config.retryCount++;
      return retryRequest(error, error.config.retryCount);
    }

    // Format error response
    return Promise.reject({
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'An error occurred',
      data: error.response?.data,
      originalError: error,
    });
  }
);

const apiService = {
  // Helper to clear cache
  clearCache: () => cache.clear(),
  
  // Helper to clear specific cache entry
  clearCacheEntry: (url, params = {}) => {
    const cacheKey = `${url}${JSON.stringify(params)}`;
    cache.delete(cacheKey);
  },

  auth: {
    signIn: (credentials) => api.post('/api/auth/signin', credentials),
    register: (userData) => api.post('/api/auth/signup', userData),
    verifyEmail: (token) => api.get(`/api/auth/verify-email/${token}`),
    resendVerification: (data) => api.post('/api/auth/resend-verification', data),
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    resetPassword: (resetData) => api.post('/api/auth/reset-password', resetData),
    refreshToken: (refreshToken) => api.post('/api/auth/refresh-token', { refreshToken }),
    getCurrentUser: () => api.get('/api/auth/me'),
    signOut: () => api.post('/api/auth/signout'),
  },

  users: {
    checkUsername: (username) => api.get(`/users/check-username/${username}`),
    checkEmail: (email) => api.get(`/users/check-email/${email}`),
    updateProfile: (userId, data) => api.put(`/users/${userId}/profile`, data),
    updatePassword: (userId, data) => api.put(`/users/${userId}/password`, data),
    getProfile: (userId) => api.get(`/users/${userId}/profile`),
  },

  tests: {
    getHistory: () => api.get('/api/tests/history'),
    getById: (id) => api.get(`/api/tests/history/${id}`),
    submit: (testData) => api.post('/api/tests/submit', testData),
    getStats: () => api.get('/api/tests/stats'),
  },

  questions: {
    getTest: () => api.get('/api/questions/test'),
    getById: (id) => api.get(`/api/questions/${id}`),
    getBySubject: (subjectId) => api.get(`/api/questions/subject/${subjectId}`),
    search: (query) => api.get('/api/questions/search', { params: query }),
  },

  performance: {
    get: (userId) => api.get(`/api/performance/${userId}`),
    getHistory: (userId) => api.get(`/api/performance/${userId}/history`),
    getBySubject: (userId, subjectId) => api.get(`/api/performance/${userId}/subject/${subjectId}`),
    getAnalytics: (userId) => api.get(`/api/performance/${userId}/analytics`),
  },

  dashboard: {
    getPerformance: () => api.get('/api/dashboard/performance'),
    getRecentTests: () => api.get('/api/dashboard/recent-tests'),
    getSubjectPerformance: () => api.get('/api/dashboard/subject-performance'),
    getAnalytics: () => api.get('/api/dashboard/analytics'),
  },

  admin: {
    getUsers: (params) => api.get('/api/admin/users', { params }),
    createUser: (userData) => api.post('/api/admin/users', userData),
    updateUser: (userId, userData) => api.put(`/api/admin/users/${userId}`, userData),
    deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
    getReports: (type = 'users') => api.get(`/api/admin/reports?type=${type}`),
    exportReport: (type, format) => 
      api.get(`/api/admin/reports/export?type=${type}&format=${format}`, { responseType: 'blob' }),
    getTestStats: () => api.get('/api/admin/stats/tests'),
    getUserStats: () => api.get('/api/admin/stats/users'),
    getPerformanceStats: () => api.get('/api/admin/stats/performance'),
    getDashboardStats: () => api.get('/api/admin/stats/dashboard'),
    uploadQuestions: (data) => api.post('/api/admin/questions/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 1 minute timeout for uploads
    }),
    deleteQuestions: (ids) => api.post('/api/admin/questions/delete', { ids }),
    updateQuestions: (data) => api.put('/api/admin/questions/update', data),
  },
};

export default apiService;