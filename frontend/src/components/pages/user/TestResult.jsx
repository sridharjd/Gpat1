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
import MockTestSubmission from '../../test/MockTestSubmission';

const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const TestResult = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        let testResult;

        if (location.state?.result) {
          // Regular test result passed through navigation
          testResult = location.state.result;
        } else if (resultId) {
          // Try to fetch mock test result
          const mockTest = MockTestSubmission.getTestById(resultId);
          if (mockTest) {
            testResult = {
              id: mockTest.id,
              score: mockTest.score,
              totalQuestions: mockTest.totalQuestions,
              correctAnswers: mockTest.correctAnswers,
              incorrectAnswers: mockTest.totalQuestions - mockTest.correctAnswers,
              timeSpent: mockTest.timeTaken,
              questions: mockTest.questions,
              date: mockTest.date,
              isMockTest: true
            };
          } else {
            throw new Error('Test result not found');
          }
        } else {
          throw new Error('No result data available');
        }

        setResult(testResult);
      } catch (error) {
        console.error('Error fetching test result:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [location.state, resultId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const calculatePercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1);
  };

  // Calculate subject-wise analysis
  const subjectWiseAnalysis = result?.questions ? Object.values(result.questions.reduce((acc, q) => {
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

  const exportToExcel = () => {
    const data = [
      ['Test Results Summary'],
      ['Test Type', result.isMockTest ? 'Mock Test' : 'Regular Test'],
      ['Date', new Date(result.date).toLocaleString()],
      ['Score', `${result.score}%`],
      ['Total Questions', result.totalQuestions],
      ['Correct Answers', result.correctAnswers],
      ['Incorrect Answers', result.incorrectAnswers],
      ['Time Spent', formatTime(result.timeSpent)],
      [],
      ['Question-wise Analysis'],
      ['Question', 'Subject', 'Your Answer', 'Correct Answer', 'Status']
    ];

    // Add question-wise data
    if (result.questions) {
      result.questions.forEach((q, index) => {
        data.push([
          q.question_text,
          q.subject_name,
          q.userAnswer || 'Not Attempted',
          q.correct_answer,
          q.isCorrect ? 'Correct' : 'Incorrect'
        ]);
      });

      // Add subject-wise analysis
      data.push([]);
      data.push(['Subject-wise Analysis']);
      data.push(['Subject', 'Score', 'Correct', 'Total']);
      subjectWiseAnalysis.forEach(subject => {
        data.push([
          subject.name,
          `${subject.score}%`,
          subject.correct,
          subject.total
        ]);
      });
    }

    // Create a worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Export to Excel
    XLSX.writeFile(workbook, `TestResults_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading test results...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
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
            {result.isMockTest ? 'Mock Test Result' : 'Test Result'}
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
                <Typography variant="h4" color="primary">{result.score}%</Typography>
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
                <Typography variant="h4">{result.totalQuestions}</Typography>
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
                <Typography variant="h4" color="success.main">{result.correctAnswers}</Typography>
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
                <Typography variant="h4">{formatTime(result.timeSpent)}</Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>

        {result.questions && (
          <>
            <Typography variant="h5" sx={{ mt: 6, mb: 3 }}>Subject-wise Analysis</Typography>
            <Grid container spacing={3}>
              {subjectWiseAnalysis.map((subject, index) => (
                <Grid item xs={12} sm={6} md={4} key={subject.name}>
                  <MotionCard
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: theme.shadows[4] }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SubjectIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{subject.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="text.secondary">Score:</Typography>
                        <Typography color="primary" fontWeight="bold">
                          {subject.score}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="text.secondary">Correct/Total:</Typography>
                        <Typography>
                          {subject.correct}/{subject.total}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(subject.score)}
                        sx={{ mt: 2, height: 8, borderRadius: 4 }}
                      />
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