import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const ProtectedLayout = ({ 
  isAuthenticated, 
  isAdmin = false,
  redirectPath = '/signin',
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // For admin routes, check both authentication and admin status
  if (!isAuthenticated || (isAdmin && !isAdmin)) {
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
        backgroundColor: (theme) => theme.palette.grey[100],
        pt: { xs: 7, sm: 8 }, // Account for fixed navbar
        px: 2
      }}
    >
      <Outlet />
    </Box>
  );
};

export default ProtectedLayout;
