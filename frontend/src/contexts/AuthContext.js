import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Check if user is already logged in from localStorage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    
    if (token && refreshToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (!user || !user.id) {
          throw new Error('Invalid user data');
        }
        return user;
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    return null;
  } catch (error) {
    console.error('Error retrieving auth state:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialAuthState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTokenRefreshing, setIsTokenRefreshing] = useState(false);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      setIsTokenRefreshing(true);
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.auth.refreshToken({ refreshToken });
      const { token, newRefreshToken } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return token;
    } catch (error) {
      clearAuthData();
      throw error;
    } finally {
      setIsTokenRefreshing(false);
    }
  }, [clearAuthData]);

  const validateToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await apiService.auth.getCurrentUser();
      setUser(response.data.user);
      setError(null);
    } catch (error) {
      console.error('Token validation error:', error);
      
      if (error.response?.status === 401) {
        try {
          await refreshToken();
          const response = await apiService.auth.getCurrentUser();
          setUser(response.data.user);
          setError(null);
          return;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      clearAuthData();
      setError('Authentication failed. Please sign in again.');
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData, refreshToken]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.auth.signIn(credentials);
      const { token, refreshToken, user: userData } = response.data;
      
      // Prepare user object for storage
      const userToStore = {
        id: userData.id,
        email: userData.email,
        isAdmin: userData.isAdmin || false,
        username: userData.username,
        ...userData
      };

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      setUser(userToStore);
      return userToStore;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.auth.register(userData);
      const { token, refreshToken, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      setIsLoading(false);
    }
  };

  const updateUser = (data) => {
    setUser(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const forgotPassword = async (email) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.auth.forgotPassword(email);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.auth.resetPassword({ token, newPassword });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.auth.verifyEmail(token);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Email verification failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: user?.isAdmin,
        error,
        isTokenRefreshing,
        login,
        logout,
        register,
        updateUser,
        resetPassword,
        verifyEmail,
        refreshToken,
        forgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};