import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Assessment as AssessmentIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const Performance = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();

  const handleApiError = useCallback((error) => {
    console.error('API Error:', error);
    if (error.response) {
      if (error.response.status === 401) {
        logout();
        return;
      }
      setError('Failed to fetch performance data. Please try again later.');
    } else if (error.request) {
      setError('Network error. Please check your connection.');
    } else {
      setError('An unexpected error occurred.');
    }
  }, [logout]);

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get test history
      const response = await apiService.tests.getHistory();
      
      if (!response?.data?.success) {
        throw new Error('Invalid response format from server');
      }

      const tests = response?.data?.data || [];
      
      // Transform the data for display
      const transformedData = tests.map(test => ({
        date: new Date(test?.completed_at || test?.created_at).toLocaleDateString(),
        score: test?.score || 0,
        accuracy: test?.total_questions ? ((test?.correct_answers || 0) / test.total_questions) * 100 : 0,
        avgTimePerQuestion: test?.total_questions ? Math.round((test?.time_taken || 0) / test.total_questions) : 0,
        subject: test?.subject_name || 'General',
        subjectScore: test?.score || 0,
      }));

      setPerformanceData(transformedData);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    if (user?.id) {
      fetchPerformanceData();
    }
  }, [user?.id, fetchPerformanceData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button
            variant="contained"
            onClick={fetchPerformanceData}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        </Box>
      )}

      <Typography variant="h4" gutterBottom>
        Performance Analytics
      </Typography>

      {/* Summary Cards */}
      {performanceData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Average Score</Typography>
                <Typography variant="h4" color="primary">
                  {Math.round(performanceData.reduce((sum, item) => sum + item.score, 0) / performanceData.length)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Accuracy</Typography>
                <Typography variant="h4" color="success.main">
                  {Math.round(performanceData.reduce((sum, item) => sum + item.accuracy, 0) / performanceData.length)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Avg. Time/Question</Typography>
                <Typography variant="h4">
                  {Math.round(performanceData.reduce((sum, item) => sum + item.avgTimePerQuestion, 0) / performanceData.length)}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Tests Taken</Typography>
                <Typography variant="h4">{performanceData.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance Over Time
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8884d8"
                  name="Score"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#82ca9d"
                  name="Accuracy"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {performanceData.length === 0 && !loading && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No performance data available yet. Take some tests to see your analytics!
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Performance;