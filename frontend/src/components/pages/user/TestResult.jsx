import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  CircularProgress,
  Alert,
  Box,
  Button,
  Typography,
  Paper
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';

const MotionContainer = motion(Container);

const TestResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('TestResult mounted with:', {
      resultId,
      locationState: location.state,
      pathname: location.pathname,
      search: location.search
    });

    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to get result from navigation state
        if (location.state?.result) {
          console.log('Using result from navigation state:', location.state.result);
          setTestResult(location.state.result);
          setLoading(false);
          return;
        }

        // If no state, fetch from API
        console.log('No result in navigation state, fetching from API with resultId:', resultId);
        const response = await apiService.test.getById(resultId);
        
        if (!response?.data?.success) {
          throw new Error('Failed to fetch test result');
        }

        console.log('Received result from API:', response.data.data);
        setTestResult(response.data.data);
      } catch (err) {
        console.error('Error fetching test result:', err);
        setError(err.message || 'Failed to load test result');
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchResult();
    } else {
      console.log('No resultId found, redirecting to test history');
      navigate('/history');
    }
  }, [resultId, location.state, navigate]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      console.log('TestResult unmounting');
    };
  }, []);

  // Add effect to handle navigation state changes
  useEffect(() => {
    console.log('Location state changed:', location.state);
  }, [location.state]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/history')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Test History
          </Button>
        </Box>
      </Container>
    );
  }

  if (!testResult) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Test result not found</Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/history')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Test History
          </Button>
        </Box>
      </Container>
    );
  }

  const percentage = Math.round((testResult.score / testResult.totalQuestions) * 100);
  const status = percentage >= 70 ? 'Passed' : 'Failed';

  return (
    <MotionContainer
      maxWidth="lg"
      sx={{ py: 4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Test Result</Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/history')}
          >
            Back to History
          </Button>
        </Box>

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h2" color={status === 'Passed' ? 'success.main' : 'error.main'}>
            {percentage}%
          </Typography>
          <Typography variant="h5" color="text.secondary">
            {status}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Score</Typography>
            <Typography variant="h4">{testResult.score}</Typography>
            <Typography color="text.secondary">out of {testResult.totalQuestions}</Typography>
          </Paper>

          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Correct Answers</Typography>
            <Typography variant="h4">{testResult.correctAnswers}</Typography>
            <Typography color="text.secondary">questions</Typography>
          </Paper>

          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Time Taken</Typography>
            <Typography variant="h4">{Math.floor(testResult.timeTaken / 60)}m {testResult.timeTaken % 60}s</Typography>
            <Typography color="text.secondary">to complete</Typography>
          </Paper>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/test')}
            sx={{ mr: 2 }}
          >
            Take Another Test
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/history')}
          >
            View Test History
          </Button>
        </Box>
      </Paper>
    </MotionContainer>
  );
};

export default TestResultPage; 