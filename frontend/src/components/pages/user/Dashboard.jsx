import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';

const MotionPaper = motion(Paper);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    performance: {
      averageScore: 0,
      totalTests: 0,
      completedTests: 0
    },
    recentTests: [],
    performanceHistory: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [performanceRes, testHistoryRes] = await Promise.all([
          apiService.user.getPerformance(),
          apiService.user.getTestHistory()
        ]);

        if (!performanceRes?.data?.success) {
          throw new Error('Failed to fetch performance data');
        }

        if (!testHistoryRes?.data?.success) {
          throw new Error('Failed to fetch test history');
        }

        const performanceData = performanceRes.data.data.overall || {
          totalTests: 0,
          completedTests: 0,
          averageScore: 0,
          averageTime: 0
        };

        setDashboardData({
          performance: {
            averageScore: performanceData.averageScore || 0,
            totalTests: performanceData.totalTests || 0,
            completedTests: performanceData.completedTests || 0
          },
          recentTests: testHistoryRes.data.data || [],
          performanceHistory: performanceRes.data.data.categories || []
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.first_name || user?.name || 'User'}
          </Typography>

          <Grid container spacing={3}>
            {/* Performance Overview */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Overview
                  </Typography>
                  {dashboardData.performance && (
                    <>
                      <Typography variant="h3" color="primary">
                        {dashboardData.performance.averageScore.toFixed(2)}%
                      </Typography>
                      <Typography color="text.secondary">
                        Average Score
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Total Tests: {dashboardData.performance.totalTests}
                        </Typography>
                        <Typography variant="body2">
                          Tests Completed: {dashboardData.performance.completedTests}
                        </Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Tests */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Tests
                  </Typography>
                  <List>
                    {dashboardData.recentTests.map((test, index) => (
                      <React.Fragment key={test.id}>
                        <ListItem>
                          <ListItemText
                            primary={test.subject_name || `Test ${test.id}`}
                            secondary={
                              <>
                                <Typography component="span" variant="body2">
                                  Score: {typeof test.score === 'number' ? test.score.toFixed(2) : '0.00'}%
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2">
                                  Date: {new Date(test.created_at).toLocaleDateString()}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        {index < dashboardData.recentTests.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Subject Performance */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Subject Performance
                  </Typography>
                  <Grid container spacing={2}>
                    {dashboardData.performanceHistory.map((subject) => (
                      <Grid item xs={12} sm={6} md={4} key={subject.category}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1">
                            {subject.category}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {typeof subject.averageScore === 'number' ? subject.averageScore.toFixed(2) : '0.00'}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {subject.completedTests} tests completed
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </MotionPaper>
    </Container>
  );
};

export default Dashboard; 