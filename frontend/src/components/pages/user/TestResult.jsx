import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Check as CorrectIcon,
  Close as WrongIcon,
  Timer as TimerIcon,
  TrendingUp as ScoreIcon,
  Assessment as AssessmentIcon,
  School as SubjectIcon,
} from '@mui/icons-material';

const TestResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  useEffect(() => {
    if (!result) {
      navigate('/dashboard');
    }
  }, [result, navigate]);

  if (!result) {
    return null;
  }

  const {
    score,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    timeSpent,
    questions
  } = result;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const calculatePercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1);
  };

  // Calculate subject-wise analysis
  const subjectWiseAnalysis = questions ? Object.values(questions.reduce((acc, q) => {
    const subject = q.subject_name;
    if (!acc[subject]) {
      acc[subject] = {
        name: subject,
        correct: 0,
        total: 0,
        score: 0
      };
    }
    acc[subject].total += 1;
    if (q.isCorrect) {
      acc[subject].correct += 1;
    }
    acc[subject].score = calculatePercentage(acc[subject].correct, acc[subject].total);
    return acc;
  }, {})) : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Test Results
      </Typography>

      {/* Score Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={parseFloat(score) || 0}
                  size={100}
                  thickness={4}
                  color={score >= 70 ? 'success' : score >= 40 ? 'warning' : 'error'}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" component="div">
                    {score?.toFixed(1) || 0}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Overall Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CorrectIcon color="success" sx={{ mr: 1 }} />
                    <Typography>
                      Correct: {correctAnswers} ({calculatePercentage(correctAnswers, totalQuestions)}%)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WrongIcon color="error" sx={{ mr: 1 }} />
                    <Typography>
                      Wrong: {incorrectAnswers} ({calculatePercentage(incorrectAnswers, totalQuestions)}%)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimerIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      Time Spent: {formatTime(timeSpent)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography>
                      Total Questions: {totalQuestions}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subject-wise Analysis */}
      {subjectWiseAnalysis.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Subject-wise Analysis
          </Typography>
          <Grid container spacing={3}>
            {subjectWiseAnalysis.map((subject, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SubjectIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        {subject.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(subject.score) || 0}
                          color={subject.score >= 70 ? 'success' : subject.score >= 40 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Typography variant="body2">
                        {subject.score}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {subject.correct} correct out of {subject.total} questions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate('/test')}
        >
          Take Another Test
        </Button>
      </Box>
    </Container>
  );
};

export default TestResult;