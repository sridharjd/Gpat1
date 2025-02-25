import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Paper, Typography, Container, Alert, CircularProgress, Button } from '@mui/material';
import api from '../../services/api';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing');
        return;
      }

      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message);
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Error verifying email');
      }
    };

    verifyToken();
  }, [token, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Verifying your email...
            </Typography>
          </>
        );
      
      case 'success':
        return (
          <>
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
            <Typography variant="body1">
              Redirecting to sign in page...
            </Typography>
          </>
        );
      
      case 'error':
        return (
          <>
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/signin')}
              sx={{ mt: 2 }}
            >
              Go to Sign In
            </Button>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={6} 
        sx={{ 
          p: 4, 
          mt: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Email Verification
        </Typography>
        {renderContent()}
      </Paper>
    </Container>
  );
};

export default VerifyEmail;
