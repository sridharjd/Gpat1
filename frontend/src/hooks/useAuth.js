import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import MockTestSubmission from '../components/test/MockTestSubmission';

const AuthContext = createContext(null);

// Check if user is already logged in from localStorage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('Initial auth state - token:', token);
    console.log('Initial auth state - user:', storedUser);
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return {
          isAuthenticated: true,
          user,
          token,
          isAdmin: user.isAdmin || false
        };
      } catch (e) {
        console.error('Error parsing stored user:', e);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      isAdmin: false
    };
  } catch (error) {
    console.error('Error retrieving auth state:', error);
    // Clear any potentially corrupted data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      isAdmin: false
    };
  }
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const initialState = getInitialAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [user, setUser] = useState(initialState.user);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(initialState.token);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(initialState.isAdmin);

  // Check auth status on mount and when token changes
  useEffect(() => {
    if (token) {
      checkAuthStatus();
    }
  }, [token]);

  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      // Clear everything if token or user is missing
      clearAuthState();
      return false;
    }

    try {
      setLoading(true);
      
      // Validate the stored user
      const parsedUser = JSON.parse(storedUser);
      
      if (!parsedUser || !parsedUser.id) {
        throw new Error('Invalid user data');
      }

      // Optional: Add a backend token validation if needed
      // const isValidToken = await apiService.validateToken(storedToken);
      // if (!isValidToken) throw new Error('Invalid token');

      // Update state
      setToken(storedToken);
      setUser(parsedUser);
      setIsAuthenticated(true);
      setIsAdmin(parsedUser.isAdmin || false);
      setError(null);

      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthState();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearAuthState = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setError('Session expired. Please sign in again.');
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.auth.login(credentials);
      
      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid login response');
      }

      const { token, user } = response.data;
      
      // Prepare user object for storage
      const userToStore = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false
      };

      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      // Update state
      setToken(token);
      setUser(userToStore);
      setIsAuthenticated(true);
      setIsAdmin(userToStore.isAdmin);
      
      return { 
        success: true, 
        user: userToStore 
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Clear any potentially invalid data
      clearAuthState();
      
      setError(error.message || 'Login failed. Please try again.');
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear mock test data
    MockTestSubmission.clearData();
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    
    // Navigate to sign in
    navigate('/signin');
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    token,
    isAdmin,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;