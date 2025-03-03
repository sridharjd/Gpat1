import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const ProtectedLayout = ({ 
  isAdmin = false,
  redirectPath = '/signin',
  isLoading = false
}) => {
  const { isAuthenticated, user, isAdmin: userIsAdmin } = useAuth();
  const location = useLocation();

  console.log('ProtectedLayout - Authentication Details:', {
    isAuthenticated,
    isAdmin,
    userIsAdmin,
    currentPath: location.pathname
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.error('Not authenticated. Redirecting to sign-in.');
    return <Navigate to={redirectPath} replace />;
  }

  // For admin routes, explicitly check admin status
  if (isAdmin && !userIsAdmin) {
    console.error('Unauthorized admin access attempt.');
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;