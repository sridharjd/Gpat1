import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
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
import { useAuth } from '../../../hooks/useAuth';
import MockTestSubmission from '../../../components/test/MockTestSubmission';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * MockDashboard - A mock implementation of the Dashboard component
 * This displays mock dashboard data without relying on the backend
 */
const MockDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get all submitted tests
  const submittedTests = MockTestSubmission.getAllSubmittedTests();
  const hasSubmittedTests = submittedTests.length > 0;
  
  // Calculate subject performance
  const subjectPerformance = {
    'Pharmacology': 0,
    'Medicinal Chemistry': 0,
    'Pharmaceutics': 0,
    'Pharmaceutical Analysis': 0
  };
  
  if (hasSubmittedTests) {
    // Group tests by subject
    const subjectTests = {};
    submittedTests.forEach(test => {
      if (!subjectTests[test.subject]) {
        subjectTests[test.subject] = [];
      }
      subjectTests[test.subject].push(test);
    });
    
    // Calculate average score for each subject
    Object.keys(subjectTests).forEach(subject => {
      const tests = subjectTests[subject];
      subjectPerformance[subject] = Math.round(
        tests.reduce((sum, test) => sum + test.score, 0) / tests.length
      );
    });
  }
  
  // Mock data
  const mockData = {
    userName: user?.name || 'User',
    recentTests: submittedTests.map(test => ({
      id: test.id,
      name: test.name,
      date: test.date,
      score: test.score,
    })).slice(0, 3), // Show only the 3 most recent tests
    subjectPerformance: {
      labels: ['Pharmacology', 'Medicinal Chemistry', 'Pharmaceutics', 'Pharmaceutical Analysis'],
      datasets: [
        {
          label: 'Average Score (%)',
          data: [
            subjectPerformance['Pharmacology'],
            subjectPerformance['Medicinal Chemistry'],
            subjectPerformance['Pharmaceutics'],
            subjectPerformance['Pharmaceutical Analysis']
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    },
    upcomingTests: [
      {
        id: 'upcoming-1',
        name: 'Medicinal Chemistry',
        date: new Date(Date.now() + 86400000).toLocaleDateString(), // Tomorrow
        duration: '60 minutes',
      },
      {
        id: 'upcoming-2',
        name: 'Pharmaceutics',
        date: new Date(Date.now() + 172800000).toLocaleDateString(), // Day after tomorrow
        duration: '45 minutes',
      },
    ],
    recommendedTopics: [
      'Drug Metabolism',
      'Pharmacokinetics',
      'Medicinal Chemistry of Antibiotics',
      'Pharmaceutical Calculations',
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Subject Performance',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {mockData.userName}! (MOCK)
      </Typography>
      
      <Grid container spacing={4}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem 
                button 
                onClick={() => navigate('/test')}
                sx={{ mb: 1, bgcolor: 'primary.light', color: 'white', borderRadius: 1 }}
              >
                <ListItemIcon>
                  <StartIcon sx={{ color: 'white' }} />
                </ListItemIcon>
                <ListItemText primary="Start New Test" />
              </ListItem>
              
              <ListItem 
                button 
                onClick={() => navigate('/performance')}
                sx={{ mb: 1 }}
              >
                <ListItemIcon>
                  <TrendingUpIcon />
                </ListItemIcon>
                <ListItemText primary="View Performance" />
              </ListItem>
              
              <ListItem 
                button 
                onClick={() => navigate('/test-history')}
              >
                <ListItemIcon>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText primary="Test History" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        {/* Performance Overview */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Performance Overview
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/performance')}
                startIcon={<AssessmentIcon />}
              >
                Full Report
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {hasSubmittedTests ? (
              <Bar data={mockData.subjectPerformance} options={chartOptions} />
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
                  onClick={() => navigate('/test')}
                  startIcon={<StartIcon />}
                >
                  Start a Test
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Tests */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Tests
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {mockData.recentTests.length > 0 ? (
              <Grid container spacing={2}>
                {mockData.recentTests.map((test) => (
                  <Grid item xs={12} key={test.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">{test.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {test.date}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <CheckCircleIcon 
                            color={test.score > 70 ? "success" : "warning"} 
                            sx={{ mr: 1, fontSize: 20 }} 
                          />
                          <Typography 
                            variant="body1"
                            color={test.score > 70 ? "success.main" : "warning.main"}
                          >
                            Score: {test.score}%
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/results/mock-result-1`)}
                        >
                          View Results
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No recent tests
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recommended Topics */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recommended Topics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {mockData.recommendedTopics.map((topic, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={topic} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Upcoming Tests */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Tests
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {mockData.upcomingTests.map((test) => (
                <Grid item xs={12} sm={6} md={4} key={test.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">{test.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {test.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {test.duration}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained"
                        onClick={() => navigate('/test')}
                      >
                        Prepare
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MockDashboard;
