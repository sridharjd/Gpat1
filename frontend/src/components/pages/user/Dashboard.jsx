import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    performance: null,
    recentTests: [],
    subjectPerformance: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Define all hooks at the top level
  const handleNavigation = useCallback((path) => {
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      setSnackbar({
        open: true,
        message: 'Navigation failed. Please try again.',
        severity: 'error',
      });
    }
  }, [navigate]);

  const handleApiError = useCallback((error) => {
    console.error('API Error:', error);
    if (error.response) {
      if (error.response.status === 401) {
        setSnackbar({
          open: true,
          message: 'Session expired. Please sign in again.',
          severity: 'error',
        });
        logout();
        navigate('/signin');
        return;
      }
      setError(error.response.data.message || 'An error occurred while fetching data');
    } else if (error.request) {
      setError('Network error. Please check your connection.');
    } else {
      setError('An unexpected error occurred.');
    }
  }, [logout, navigate]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const performanceRes = await api.get('/dashboard/performance');
      const testsRes = await api.get('/dashboard/recent-tests');
      const subjectsRes = await api.get('/dashboard/subject-performance');

      setDashboardData({
        performance: performanceRes.data.success ? performanceRes.data.data : null,
        recentTests: testsRes.data.success ? testsRes.data.data : [],
        subjectPerformance: subjectsRes.data.success ? {
          labels: subjectsRes.data.data.subjects || [],
          data: subjectsRes.data.data.scores || []
        } : null,
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar({ ...snackbar, open: false });
  }, [snackbar]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance by Subject',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchDashboardData}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Grid container spacing={3}>
          {/* Performance Overview */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overall Performance
                </Typography>
                {dashboardData.performance ? (
                  <>
                    <Typography variant="h3" color="primary" align="center">
                      {(Number(dashboardData.performance.averageScore) || 0).toFixed(1)}%
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <AssessmentIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Total Tests"
                          secondary={dashboardData.performance.totalTests || 0}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TrendingUpIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Highest Score"
                          secondary={`${(Number(dashboardData.performance.highestScore) || 0).toFixed(1)}%`}
                        />
                      </ListItem>
                    </List>
                  </>
                ) : (
                  <Typography color="textSecondary">No performance data available</Typography>
                )}
              </CardContent>
              <Divider />
              <CardActions>
                <Button
                  startIcon={<StartIcon />}
                  onClick={() => handleNavigation('/test')}
                  fullWidth
                >
                  Start New Test
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Subject Performance */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance by Subject
                </Typography>
                {dashboardData.subjectPerformance && dashboardData.subjectPerformance.labels.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <Bar
                      options={chartOptions}
                      data={{
                        labels: dashboardData.subjectPerformance.labels,
                        datasets: [
                          {
                            label: 'Average Score (%)',
                            data: dashboardData.subjectPerformance.data,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                          },
                        ],
                      }}
                    />
                  </Box>
                ) : (
                  <Typography color="textSecondary">No subject performance data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Tests */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Tests
                </Typography>
                {dashboardData.recentTests.length > 0 ? (
                  <List>
                    {dashboardData.recentTests.map((test, index) => (
                      <ListItem key={index} divider={index !== dashboardData.recentTests.length - 1}>
                        <ListItemIcon>
                          <HistoryIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Score: ${(Number(test.score) || 0).toFixed(1)}%`}
                          secondary={`Date: ${new Date(test.created_at).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary">No recent tests</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Container>
  );
};

export default Dashboard;
