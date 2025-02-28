import axios from 'axios';

// Create API instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      console.log('Token being sent:', token);
      // Make sure we're sending the token exactly as the backend expects it
      // The backend expects: Authorization: Bearer <token>
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
      if (token) {
        console.log('Auth header:', config.headers.Authorization);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    // Create a standardized error object
    const errorResponse = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'An unexpected error occurred',
      data: error.response?.data || {},
      originalError: error
    };
    
    // Handle specific error cases
    if (error.response) {
      // Handle 400 Bad Request with more details
      if (error.response.status === 400) {
        if (error.response.data && error.response.data.message === 'Missing required fields') {
          errorResponse.message = `Missing required fields: ${error.response.data.fields?.join(', ') || 'unknown fields'}`;
        }
      }
      
      // Handle 401 Unauthorized responses
      if (error.response.status === 401) {
        // Clear all auth data
        localStorage.removeItem('token');
        
        // Dispatch an event that can be listened to by the auth context
        window.dispatchEvent(new CustomEvent('auth:unauthorized', {
          detail: { message: 'Your session has expired. Please sign in again.' }
        }));
        
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
      
      // Handle 429 Too Many Requests
      if (error.response.status === 429) {
        errorResponse.message = 'Too many requests. Please try again later.';
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorResponse.message = 'No response from server. Please check your internet connection.';
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', errorResponse);
    }
    
    return Promise.reject(errorResponse);
  }
);

// API service methods
const apiService = {
  // Auth methods
  auth: {
    login: (credentials) => api.post('/auth/signin', credentials),
    signIn: (credentials) => api.post('/auth/signin', credentials),
    register: (userData) => api.post('/auth/signup', userData),
    getCurrentUser: () => api.get('/auth/me'),
    changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
    forgotPassword: (email) => api.post('/auth/forgot-password', email),
    resetPassword: (resetData) => api.post('/auth/reset-password', resetData),
    verifyEmail: (token) => api.post('/auth/verify-email', { token })
  },
  
  // Test methods
  tests: {
    getFilters: () => api.get('/tests/filters'),
    getQuestions: (params) => api.get('/tests/questions', { params }),
    submitTest: (testData) => {
      // Ensure all required fields are present
      const requiredFields = ['answers', 'test_id', 'subject_id', 'time_spent', 'total_questions'];
      const missingFields = requiredFields.filter(field => 
        testData[field] === undefined || testData[field] === null || 
        (field !== 'time_spent' && testData[field] === 0)
      );
      
      if (missingFields.length > 0) {
        console.error('Missing required fields for test submission:', missingFields);
        return Promise.reject({
          status: 400,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      console.log('Sending test data to server:', JSON.stringify(testData));
      return api.post('/tests/submit', testData);
    },
    submitTestRaw: (payload) => api.post('/tests/submit', payload),
    getHistory: (params) => api.get('/tests/history', { params }),
    getById: (id) => api.get(`/tests/${id}`),
    getStats: () => api.get('/tests/stats')
  },
  
  // User methods
  user: {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (profileData) => api.put('/users/profile', profileData),
    getPerformance: () => api.get('/dashboard/performance'),
    getSettings: () => api.get('/users/settings')
  },
  
  // Exam methods
  exams: {
    getInfo: () => api.get('/exams/info')
  },
  
  // Dashboard methods
  dashboard: {
    getPerformance: () => api.get('/dashboard/performance'),
    getRecentTests: () => api.get('/dashboard/recent-tests'),
    getSubjectPerformance: () => api.get('/dashboard/subject-performance')
  },
  
  // Admin methods
  admin: {
    getUsers: () => api.get('/admin/users'),
    updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getReports: (params) => api.get('/admin/reports', { params }),
    getReportData: (params) => api.get('/admin/reports/data', { params })
  },
  
  // Contact methods
  contact: {
    submitForm: (formData) => api.post('/contact', formData)
  }
};

export default apiService;