import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedLayout = ({ 
  isAdmin = false,
  redirectPath = '/signin',
  isLoading = false,
  requireVerified = true
}) => {
  const { isAuthenticated, user, isAdmin: userIsAdmin, loading: authLoading } = useAuth();
  const location = useLocation();

  // Show loading state while authentication is being checked
  if (isLoading || authLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Verifying access...
        </Typography>
      </Box>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    console.warn('Access denied: User not authenticated');
    // Save the attempted URL for redirection after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Check email verification if required
  if (requireVerified && !user?.isVerified) {
    console.warn('Access denied: Email not verified');
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // Check admin access
  if (isAdmin && !userIsAdmin) {
    console.warn('Access denied: Admin privileges required');
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user account is active
  if (!user?.isActive) {
    console.warn('Access denied: Account inactive');
    return <Navigate to="/account-suspended" replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', pt: 8, pb: 4 }}>
      <Outlet />
    </Box>
  );
};

export default ProtectedLayout;