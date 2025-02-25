import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  School as SubjectIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [performanceResponse, testsResponse, progressResponse] = await Promise.all([
          api.get('/dashboard/performance'),
          api.get('/dashboard/recent-tests'),
          api.get('/dashboard/progress')
        ]);

        setPerformanceData(performanceResponse.data);
        setRecentTests(testsResponse.data);
        setProgressData(progressResponse.data);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard data error:', err);
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
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Start
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Begin a new practice test to improve your skills
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                startIcon={<StartIcon />}
                onClick={() => navigate('/test')}
              >
                Start New Test
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test History
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                View your past test attempts and analyze performance
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => navigate('/test-history')}
              >
                View History
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Detailed analysis of your test performance
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                onClick={() => navigate('/performance')}
              >
                View Analytics
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Over Time */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Progress Over Time
            </Typography>
            {progressData && (
              <Line
                data={{
                  labels: progressData.dates,
                  datasets: [{
                    label: 'Average Score (%)',
                    data: progressData.scores,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Your Learning Progress'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            )}
          </Paper>
        </Grid>

        {/* Subject Performance */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance by Subject
            </Typography>
            {performanceData && (
              <Bar
                data={{
                  labels: performanceData.subjects,
                  datasets: [{
                    label: 'Average Score (%)',
                    data: performanceData.scores,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentTests.map((test) => (
                <React.Fragment key={test.id}>
                  <ListItem>
                    <ListItemIcon>
                      <AssessmentIcon color={test.score >= 70 ? "success" : "primary"} />
                    </ListItemIcon>
                    <ListItemText
                      primary={test.subject}
                      secondary={`Score: ${test.score}% - ${new Date(test.date).toLocaleDateString()}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
