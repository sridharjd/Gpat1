import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert, 
  Grid, 
  Box, 
  Divider,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Menu,
  MenuItem,
  ListItemIcon as MenuListItemIcon
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  EmojiEvents as EmojiEventsIcon,
  School as SchoolIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import MockTestSubmission from '../../../components/test/MockTestSubmission';
import ExportUtils from '../../../utils/exportUtils';
import { useAuth } from '../../../hooks/useAuth';

/**
 * MockPerformance - A mock implementation of the Performance component
 * This displays mock performance data without relying on the backend
 */
const MockPerformance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // Handle export menu open
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  // Handle export menu close
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };
  
  // Export functions
  const exportToPDF = () => {
    ExportUtils.exportPerformanceToPDF(performanceData, user?.name || 'User');
    handleExportMenuClose();
  };
  
  const exportToExcel = () => {
    ExportUtils.exportPerformanceToExcel(performanceData);
    handleExportMenuClose();
  };

  useEffect(() => {
    // Simulate API call
    const fetchMockPerformanceData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all submitted tests
      const submittedTests = MockTestSubmission.getAllSubmittedTests();
      const hasSubmittedTests = submittedTests.length > 0;
      
      // Calculate average score
      const averageScore = hasSubmittedTests 
        ? Math.round(submittedTests.reduce((sum, test) => sum + test.score, 0) / submittedTests.length) 
        : 0;
      
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
      
      // Find strengths and weaknesses
      const strengths = [];
      const weaknesses = [];
      
      if (hasSubmittedTests) {
        // Find subjects with scores above 70%
        Object.entries(subjectPerformance).forEach(([subject, score]) => {
          if (score > 0) {
            if (score >= 70) {
              strengths.push(subject);
            } else if (score < 50) {
              weaknesses.push(subject);
            }
          }
        });
      } else {
        weaknesses.push('No tests taken yet');
      }
      
      // Create recent activity from test submissions
      const recentActivity = submittedTests.map(test => ({
        type: 'test',
        date: test.date,
        description: `Completed a ${test.subject} test`
      })).slice(0, 5); // Show only the 5 most recent activities
      
      // Create mock performance data
      const mockData = {
        averageScore,
        totalTests: submittedTests.length,
        testHistory: submittedTests.map(test => ({
          id: test.id,
          date: test.date,
          score: test.score,
          totalQuestions: test.totalQuestions,
          correctAnswers: test.correctAnswers,
          timeTaken: MockTestSubmission.formatTime(test.timeTaken)
        })).slice(0, 5), // Show only the 5 most recent tests
        subjectPerformance,
        strengths,
        weaknesses,
        recentActivity
      };
      
      setPerformanceData(mockData);
      setLoading(false);
    };

    fetchMockPerformanceData();
  }, []);
  
  /**
   * Format seconds into a readable time format (mm:ss)
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading performance data...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Performance Overview (MOCK)
      </Typography>
      
      {performanceData.totalTests === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          You haven't taken any tests yet. Complete some tests to see your performance data.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Average Score</Typography>
                </Box>
                <Typography variant="h3" color="primary">{performanceData.averageScore}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Tests Taken</Typography>
                </Box>
                <Typography variant="h3" color="primary">{performanceData.totalTests}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Best Subject</Typography>
                </Box>
                <Typography variant="h3" color="primary">
                  {performanceData.strengths.length > 0 ? performanceData.strengths[0] : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Subject Performance */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h5" gutterBottom>Subject Performance</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                {Object.entries(performanceData.subjectPerformance).map(([subject, score]) => (
                  <Grid item xs={12} key={subject}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">{subject}</Typography>
                        <Typography variant="body1">{score}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={score} 
                        color={score > 70 ? "success" : score > 40 ? "primary" : "error"}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
          
          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, mt: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>Recent Activity</Typography>
              <Divider sx={{ mb: 3 }} />
              
              {performanceData.recentActivity.length > 0 ? (
                <List>
                  {performanceData.recentActivity.map((activity, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={activity.description}
                        secondary={activity.date}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1">No recent activity</Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Test History */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, mt: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>Test History</Typography>
              <Divider sx={{ mb: 3 }} />
              
              {performanceData.testHistory.length > 0 ? (
                <Box>
                  {performanceData.testHistory.map((test, index) => (
                    <Card key={index} sx={{ mb: 2, bgcolor: 'background.default' }}>
                      <CardContent>
                        <Typography variant="subtitle1">Test {index + 1}</Typography>
                        <Typography variant="body2" color="text.secondary">Date: {test.date}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2">Score: {test.score}%</Typography>
                          <Typography variant="body2">
                            <TimerIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {test.timeTaken}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body1">No test history available</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      <Button 
        variant="contained" 
        color="primary" 
        endIcon={<DownloadIcon />}
        onClick={handleExportMenuOpen}
        sx={{ position: 'fixed', bottom: 20, right: 20 }}
      >
        Export
      </Button>
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={exportToPDF}>
          <MenuListItemIcon>
            <PdfIcon fontSize="small" />
          </MenuListItemIcon>
          PDF
        </MenuItem>
        <MenuItem onClick={exportToExcel}>
          <MenuListItemIcon>
            <ExcelIcon fontSize="small" />
          </MenuListItemIcon>
          Excel
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default MockPerformance;
