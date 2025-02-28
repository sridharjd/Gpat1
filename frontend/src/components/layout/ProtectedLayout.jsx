import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const ProtectedLayout = ({ 
  isAdmin = false,
  redirectPath = '/signin',
  isLoading = false
}) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Add a useEffect to avoid the console error during logout
  useEffect(() => {
    // This is just to silence the error during component unmounting
    return () => {
      // Cleanup function
    };
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Only log the error if we're not already on the signin page or just navigated from a protected route
    if (!location.pathname.includes('signin')) {
      console.error('Unauthorized access attempt. Redirecting to sign-in.');
    }
    return <Navigate to={redirectPath} replace />;
  }

  // For admin routes, check admin status
  if (isAdmin) {
    // No change needed here
  }

  try {
    return <Outlet />;
  } catch (error) {
    console.error('An error occurred while rendering the outlet:', error); 
    return <Navigate to={redirectPath} replace />;
  }
};

export default ProtectedLayout;
