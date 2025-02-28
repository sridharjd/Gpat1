import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import apiService from '../services/api';

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
          token
        };
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // Clear any invalid data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return {
      isAuthenticated: false,
      user: null,
      token: null
    };
  } catch (error) {
    console.error('Error retrieving auth state:', error);
    // Clear any potentially corrupted data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return {
      isAuthenticated: false,
      user: null,
      token: null
    };
  }
};

export const AuthProvider = ({ children }) => {
  const initialState = getInitialAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [user, setUser] = useState(initialState.user);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(initialState.token);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(initialState.user?.isAdmin || false);

  // Check auth status on mount and when token changes
  useEffect(() => {
    if (token) {
      checkAuthStatus();
    }
  }, [token]);

  const checkAuthStatus = async () => {
    if (!token) return false;
    
    try {
      setLoading(true);
      
      // Get the stored user
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        throw new Error('No user found');
      }
      
      const user = JSON.parse(storedUser);
      setUser(user);
      setIsAuthenticated(true);
      setIsAdmin(user.isAdmin);
      setError(null);
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      // If the token is invalid, clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      setError('Session expired. Please sign in again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create a mock JWT token for development/testing
  const createMockJWT = (user) => {
    // Create a JWT-like structure with three parts
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      id: user.id,
      isAdmin: user.isAdmin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    };
    
    // Base64Url encode the parts
    const base64Url = (obj) => {
      const str = JSON.stringify(obj);
      const base64 = Buffer.from(str).toString('base64');
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };
    
    const headerBase64 = base64Url(header);
    const payloadBase64 = base64Url(payload);
    const signature = base64Url('mock_signature');
    
    return `${headerBase64}.${payloadBase64}.${signature}`;
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.auth.login(credentials);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store token and user in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update state
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        setIsAdmin(user.isAdmin);
        
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear auth state
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setIsAdmin(false);
    
    // Clear stored tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return { success: true };
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