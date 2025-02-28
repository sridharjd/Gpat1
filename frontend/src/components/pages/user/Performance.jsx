import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import apiService from '../../../services/api';

const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await apiService.user.getPerformance();
        setPerformanceData(response.data);
        console.log('Performance data fetched successfully:', response.data);
      } catch (err) {
        setError('Failed to fetch performance data');
        console.error('Performance data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container>
      <Paper>
        <Typography variant="h4">Performance Overview</Typography>
        {performanceData && (
          <div>
            <Typography variant="h6">Average Score: {performanceData.averageScore}%</Typography>
            <Typography variant="h6">Total Tests Taken: {performanceData.totalTests}</Typography>
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default Performance;