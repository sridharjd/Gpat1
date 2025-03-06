import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import {
  Check as CorrectIcon,
  Close as WrongIcon,
  Timer as TimerIcon,
  TrendingUp as ScoreIcon,
  Assessment as AssessmentIcon,
  School as SubjectIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';

const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const TestResult = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.tests.getById(resultId);
        
        if (!response?.data?.success) {
          throw new Error('Failed to fetch test result');
        }

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
    }
  }, [resultId]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculatePercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  const exportToExcel = () => {
    if (!testResult) return;

    const data = [
      ['Test Result Summary'],
      ['Subject', testResult.subject_name],
      ['Date', new Date(testResult.created_at).toLocaleDateString()],
      ['Score', `${testResult.score}%`],
      ['Time Taken', formatTime(testResult.time_taken)],
      ['Total Questions', testResult.total_questions],
      ['Correct Answers', testResult.correct_answers],
      ['Incorrect Answers', testResult.total_questions - testResult.correct_answers],
      ['Accuracy', `${calculatePercentage(testResult.correct_answers, testResult.total_questions)}%`],
      [],
      ['Question Details'],
      ['Question', 'Your Answer', 'Correct Answer', 'Status']
    ];

    // Add question details
    testResult.questions?.forEach((q, index) => {
      data.push([
        `Question ${index + 1}`,
        q.selected_answer || 'Not answered',
        q.correct_answer,
        q.is_correct ? 'Correct' : 'Incorrect'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test Result');
    XLSX.writeFile(wb, `Test_Result_${resultId}.xlsx`);
  };

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
        <Button
          variant="contained"
          onClick={() => navigate('/test-history')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Test History
        </Button>
      </Container>
    );
  }

  if (!testResult) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Test result not found</Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/test-history')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Test History
        </Button>
      </Container>
    );
  }

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <MotionPaper
        elevation={3}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        sx={{ p: 4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">
            {testResult.isMockTest ? 'Mock Test Result' : 'Test Result'}
          </Typography>
          <Button
            variant="contained"
            onClick={exportToExcel}
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: 2 }}
          >
            Export to Excel
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <ScoreIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Score</Typography>
                <Typography variant="h4" color="primary">{testResult.score}%</Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Questions</Typography>
                <Typography variant="h4">{testResult.total_questions}</Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <CorrectIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Correct</Typography>
                <Typography variant="h4" color="success.main">{testResult.correct_answers}</Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Time Spent</Typography>
                <Typography variant="h4">{formatTime(testResult.time_taken)}</Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>

        {testResult.questions && (
          <>
            <Typography variant="h5" sx={{ mt: 6, mb: 3 }}>Subject-wise Analysis</Typography>
            <Grid container spacing={3}>
              {testResult.questions.map((question, index) => (
                <Grid item xs={12} sm={6} md={4} key={question.id}>
                  <MotionCard
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: theme.shadows[4] }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SubjectIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{question.question_text}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="text.secondary">Your Answer:</Typography>
                        <Typography color="primary" fontWeight="bold">
                          {question.selected_answer || 'Not answered'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Correct Answer:</Typography>
                        <Typography color="primary" fontWeight="bold">
                          {question.correct_answer}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Status:</Typography>
                        <Typography color={question.is_correct ? "success" : "error"} fontWeight="bold">
                          {question.is_correct ? 'Correct' : 'Incorrect'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/dashboard')}
                sx={{ mr: 2, borderRadius: 2 }}
              >
                Back to Dashboard
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/practice')}
                sx={{ borderRadius: 2 }}
              >
                Practice More
              </Button>
            </Box>
          </>
        )}
      </MotionPaper>
    </Container>
  );
};

export default TestResult;