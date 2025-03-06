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
  useTheme
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Timer as TimerIcon
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
import { motion } from 'framer-motion';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MotionCard = motion(Card);
const MotionPaper = motion(Paper);

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    performance: {
      averageScore: 0,
      totalTests: 0,
      highestScore: 0,
      totalTime: 0
    },
    recentTests: [],
    subjectPerformance: {
      labels: [],
      data: []
    },
    recommendedTopics: [],
    upcomingTests: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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
      setError('Failed to fetch dashboard data. Please try again later.');
    } else if (error.request) {
      setError('Network error. Please check your connection.');
    } else {
      setError('An unexpected error occurred.');
    }
  }, [logout, navigate]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch real data from the API
      const [performanceRes, testsRes, subjectsRes] = await Promise.all([
        apiService.dashboard.getPerformance(),
        apiService.dashboard.getRecentTests(),
        apiService.dashboard.getSubjectPerformance()
      ]);

      if (!performanceRes?.data?.success || !testsRes?.data?.success || !subjectsRes?.data?.success) {
        throw new Error('Invalid response format from server');
      }

      const performanceData = performanceRes?.data?.data || {};
      const testsData = testsRes?.data?.data || [];
      const subjectsData = subjectsRes?.data?.data || [];

      setDashboardData({
        performance: {
          averageScore: performanceData?.overall?.average_score || 0,
          totalTests: performanceData?.overall?.total_tests || 0,
          highestScore: performanceData?.overall?.highest_score || 0,
          totalTime: performanceData?.overall?.total_time || 0
        },
        recentTests: testsData.map(test => ({
          id: test?.id || '',
          name: test?.subject_name ? `${test.subject_name} Test` : 'Test',
          date: test?.created_at || new Date().toISOString(),
          score: test?.score || 0,
          subject: test?.subject_name || 'General'
        })),
        subjectPerformance: {
          labels: subjectsData.map(subject => subject?.name || 'Unknown'),
          data: subjectsData.map(subject => subject?.average_score || 0)
        },
        recommendedTopics: [],
        upcomingTests: []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
    maintainAspectRatio: false,
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
        title: {
          display: true,
          text: 'Score (%)'
        }
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          variant="contained"
          onClick={fetchDashboardData}
          startIcon={<AssessmentIcon />}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.name || 'User'}!
        </Typography>

        <Grid container spacing={4}>
          {/* Performance Stats */}
          <Grid item xs={12} md={4}>
            <MotionCard
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            >
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h6" gutterBottom>Overall Performance</Typography>
                  <Typography variant="h3" color="primary">
                    {dashboardData.performance?.averageScore.toFixed(1)}%
                  </Typography>
                </Box>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Tests"
                      secondary={dashboardData.performance?.totalTests || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Highest Score"
                      secondary={`${dashboardData.performance?.highestScore.toFixed(1)}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TimerIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Time"
                      secondary={`${Math.floor(dashboardData.performance?.totalTime / 60)}h ${dashboardData.performance?.totalTime % 60}m`}
                    />
                  </ListItem>
                </List>
              </CardContent>
              <Divider />
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleNavigation('/test')}
                  startIcon={<StartIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Start New Test
                </Button>
              </CardActions>
            </MotionCard>
          </Grid>

          {/* Subject Performance */}
          <Grid item xs={12} md={8}>
            <MotionCard
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Performance by Subject</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleNavigation('/performance')}
                    startIcon={<AssessmentIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Full Report
                  </Button>
                </Box>
                <Box sx={{ height: 300 }}>
                  {dashboardData.subjectPerformance?.labels.length > 0 ? (
                    <Bar
                      options={chartOptions}
                      data={{
                        labels: dashboardData.subjectPerformance.labels,
                        datasets: [{
                          label: 'Average Score (%)',
                          data: dashboardData.subjectPerformance.data,
                          backgroundColor: theme.palette.primary.light,
                          borderColor: theme.palette.primary.main,
                          borderWidth: 1
                        }]
                      }}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No test data available yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Take your first test to see your performance
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => handleNavigation('/test')}
                        startIcon={<StartIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        Start a Test
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Recent Tests */}
          <Grid item xs={12} md={6}>
            <MotionCard
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Recent Tests</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleNavigation('/test-history')}
                    startIcon={<HistoryIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    View All
                  </Button>
                </Box>
                {dashboardData.recentTests.length > 0 ? (
                  <List>
                    {dashboardData.recentTests.map((test) => (
                      <ListItem key={test.id} divider>
                        <ListItemText
                          primary={test.name}
                          secondary={`${test.subject} • ${new Date(test.date).toLocaleDateString()}`}
                        />
                        <Typography
                          variant="body2"
                          color={test.score >= 70 ? 'success.main' : 'error.main'}
                          sx={{ fontWeight: 'bold' }}
                        >
                          {test.score}%
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    No tests taken yet
                  </Typography>
                )}
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Recommended Topics */}
          <Grid item xs={12} md={6}>
            <MotionCard
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommended Topics
                </Typography>
                <List>
                  {dashboardData.recommendedTopics.map((topic, index) => (
                    <ListItem key={index} divider={index < dashboardData.recommendedTopics.length - 1}>
                      <ListItemIcon>
                        <SchoolIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={topic} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      </motion.div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;
