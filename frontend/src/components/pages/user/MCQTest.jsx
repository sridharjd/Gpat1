import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Timer as TimerIcon,
  Flag as FlagIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const MCQTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit, isConnected } = useWebSocket();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ subjects: [], years: [] });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [testStarted, setTestStarted] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  const startTimeRef = useRef(Date.now());
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    // Load saved test state from localStorage
    const savedState = localStorage.getItem('testState');
    if (savedState) {
      try {
        const { answers, flagged, timeLeft, questions, currentIndex } = JSON.parse(savedState);
        setAnswers(answers);
        setFlagged(flagged);
        setTimeLeft(timeLeft);
        setQuestions(questions);
        setCurrentIndex(currentIndex);
        setTestStarted(true);
        setLoading(false);
      } catch (error) {
        console.error('Error loading saved test state:', error);
      }
    }
  }, [user, navigate]);

  const saveTestState = useCallback(() => {
    try {
      const state = {
        answers: answersRef.current,
        flagged,
        timeLeft,
        questions,
        currentIndex
      };
      localStorage.setItem('testState', JSON.stringify(state));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving test state:', error);
    }
  }, [flagged, timeLeft, questions, currentIndex]);

  // Auto-save test state
  useEffect(() => {
    if (testStarted) {
      const interval = setInterval(saveTestState, AUTO_SAVE_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [testStarted, saveTestState]);

  const fetchFilters = useCallback(async () => {
    try {
      const response = await apiService.tests.getFilters();
      if (response.data.success) {
        setFilters(response.data.data);
        setError('');
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
      setError('Failed to load filters. Please try again later.');
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        count: 10,
        subject_id: selectedSubject || undefined,
        year: selectedYear || undefined
      };
      
      const response = await apiService.tests.getQuestions(params);

      if (response?.data?.success) {
        if (response.data.data?.length > 0) {
          setQuestions(response.data.data);
          setCurrentIndex(0);
          setAnswers({});
          setFlagged([]);
          setError('');
          startTimeRef.current = Date.now();
        } else {
          setError('No questions found for the selected criteria.');
          setQuestions([]);
        }
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to fetch questions. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedYear]);

  useEffect(() => {
    fetchFilters();
    fetchQuestions();
  }, [fetchFilters, fetchQuestions]);

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          // Show warning when 5 minutes remaining
          if (newTime === 300) {
            setShowTimeWarning(true);
          }
          
          // Emit progress update every minute
          if (newTime % 60 === 0) {
            emit('UPDATE_TEST_PROGRESS', {
              timeLeft: newTime,
              questionsAnswered: Object.keys(answersRef.current).length,
              totalQuestions: questions.length,
              flaggedQuestions: flagged.length
            });
          }
          
          // Auto-submit when time is up
          if (newTime <= 0) {
            submitTest();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, emit, questions.length, flagged.length]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: answer };
      // Emit answer update
      emit('UPDATE_ANSWER', {
        questionId,
        answer,
        totalAnswered: Object.keys(newAnswers).length,
      });
      return newAnswers;
    });
  }, [emit]);

  const submitTest = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Format the data to match backend expectations
      const testData = {
        answers: answersRef.current,
        testData: {
          timeTaken: timeSpent,
          subjectId: selectedSubject || null,
          year: selectedYear || null,
          totalQuestions: questions.length
        }
      };
      
      const result = await apiService.tests.submit(testData);

      // Clear saved test state
      localStorage.removeItem('testState');

      // Emit test completion
      emit('TEST_COMPLETED', {
        testId: result.data.test.id,
        score: result.data.test.score,
        timeSpent,
        totalQuestions: questions.length,
        answeredQuestions: Object.keys(answersRef.current).length
      });

      navigate('/test-result', { 
        state: { 
          result: result.data,
          answers: answersRef.current
        }
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      setError('Failed to submit test. Your progress has been saved. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const progress = (Object.keys(answers).length / questions.length) * 100;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!isConnected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are currently offline. Your answers will be saved locally and synced when you reconnect.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color={timeLeft <= 300 ? 'error' : 'inherit'}>
            <TimerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Time Left: {formatTime(timeLeft)}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6">
              Question {currentIndex + 1} of {questions.length}
            </Typography>
            {lastSaved && (
              <Tooltip title={`Last saved: ${lastSaved.toLocaleTimeString()}`}>
                <SaveIcon color="success" />
              </Tooltip>
            )}
          </Stack>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mb: 2, height: 10, borderRadius: 5 }}
        />

        {!testStarted ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h5" gutterBottom>
              Ready to Start the Test?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You will have {formatTime(timeLeft)} to complete {questions.length} questions.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => setTestStarted(true)}
            >
              Start Test
            </Button>
          </Box>
        ) : (
          <>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body1" gutterBottom>
                    {questions[currentIndex]?.question_text}
                  </Typography>
                  <Button
                    variant="outlined"
                    color={flagged.includes(currentIndex) ? 'warning' : 'primary'}
                    startIcon={<FlagIcon />}
                    onClick={() => setFlagged(prev => 
                      prev.includes(currentIndex) 
                        ? prev.filter(i => i !== currentIndex)
                        : [...prev, currentIndex]
                    )}
                  >
                    {flagged.includes(currentIndex) ? 'Unflag' : 'Flag'}
                  </Button>
                </Box>
                <RadioGroup
                  value={answers[questions[currentIndex]?.id] || ''}
                  onChange={(e) => handleAnswer(questions[currentIndex]?.id, e.target.value)}
                >
                  {questions[currentIndex]?.options.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={<Radio />}
                      label={option}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<PrevIcon />}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              {currentIndex === questions.length - 1 ? (
                <Tooltip title={isSubmitting ? 'Submitting...' : 'Submit Test'}>
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<CheckIcon />}
                      onClick={() => setShowConfirmSubmit(true)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Test'}
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button
                  variant="contained"
                  endIcon={<NextIcon />}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                >
                  Next
                </Button>
              )}
            </Box>
          </>
        )}

        <Dialog
          open={showConfirmSubmit}
          onClose={() => setShowConfirmSubmit(false)}
        >
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogContent>
            <Typography paragraph>
              Are you sure you want to submit the test?
            </Typography>
            <Typography color="warning.main">
              {Object.keys(answers).length < questions.length &&
                `Warning: You have ${questions.length - Object.keys(answers).length} unanswered questions.`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConfirmSubmit(false)}>
              Continue Test
            </Button>
            <Button
              onClick={submitTest}
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={showTimeWarning}
          onClose={() => setShowTimeWarning(false)}
        >
          <DialogTitle>
            <WarningIcon color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Time Warning
          </DialogTitle>
          <DialogContent>
            <Typography>
              You have 5 minutes remaining to complete the test.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowTimeWarning(false)} variant="contained">
              Continue Test
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default MCQTest;
