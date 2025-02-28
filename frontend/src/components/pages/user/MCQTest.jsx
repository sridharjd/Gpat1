import React, { useState, useEffect, useCallback } from 'react';
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
  Stack
} from '@mui/material';
import {
  Timer as TimerIcon,
  Flag as FlagIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Check as CheckIcon,
  FilterList as FilterIcon,
  Subject as SubjectIcon,
  Event as EventIcon
} from '@mui/icons-material';
import apiService from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import MinimalTestSubmission from '../../../components/test/MinimalTestSubmission';
import MockTestSubmission from '../../../components/test/MockTestSubmission';

const MCQTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ subjects: [], years: [] });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const fetchFilters = useCallback(async (retry = 0) => {
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

  const fetchQuestions = useCallback(async (retry = 0) => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        count: 10,
        subject_id: selectedSubject || undefined,
        year: selectedYear || undefined
      };
      
      const response = await apiService.tests.getQuestions(params);

      if (response.data.success) {
        if (response.data.data && response.data.data.length > 0) {
          setQuestions(response.data.data);
          setCurrentIndex(0);
          setAnswers({});
          setFlagged([]);
          setError('');
        } else {
          setError('No questions found for the selected criteria. Please try different filters.');
          setQuestions([]);
        }
      } else {
        setError(response.data.message || 'Failed to fetch questions');
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      if (error.response?.status === 429 && retry < maxRetries) {
        // If rate limited, wait and retry
        setTimeout(() => {
          fetchQuestions(retry + 1);
        }, retryDelay * Math.pow(2, retry)); // Exponential backoff
      } else {
        setError('Failed to fetch questions. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedYear]);

  useEffect(() => {
    fetchFilters();
    fetchQuestions();
  }, [fetchFilters, fetchQuestions]);

  // Timer effect
  useEffect(() => {
    // Only start timer when questions are loaded
    if (questions.length === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          // Auto-submit when time is up
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup timer on unmount
    return () => clearInterval(timer);
  }, [questions]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const toggleFlag = (questionIndex) => {
    setFlagged((prevFlagged) => {
      if (prevFlagged.includes(questionIndex)) {
        return prevFlagged.filter((index) => index !== questionIndex);
      } else {
        return [...prevFlagged, questionIndex];
      }
    });
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers((prevAnswers) => ({ ...prevAnswers, [questionId]: answer }));
  };

  const submitTest = async () => {
    try {
      console.log('Raw answers object:', answers);
      
      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      // Get the selected subject name
      const subjectName = selectedSubject 
        ? filters.subjects.find(s => s.id === selectedSubject)?.name || 'Pharmacology'
        : 'Pharmacology';
      
      // Use the mock test submission service
      const result = await MockTestSubmission.submitTest(answers, timeSpent, subjectName);
      console.log('Test submitted successfully (MOCK):', result);
      
      // Navigate to results page
      if (result && result.resultId) {
        navigate(`/results/${result.resultId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      let errorMessage = 'Failed to submit test. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>MCQ Test</Typography>
        <Stack direction="row" spacing={2}>
          {selectedSubject && (
            <Chip
              icon={<SubjectIcon />}
              label={`Subject: ${filters.subjects.find(s => s.id === selectedSubject)?.name || selectedSubject}`}
              color="primary"
              variant="outlined"
            />
          )}
          {selectedYear && (
            <Chip
              icon={<EventIcon />}
              label={`Year: ${selectedYear}`}
              color="secondary"
              variant="outlined"
            />
          )}
        </Stack>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <MenuItem value="">All Subjects</MenuItem>
                {filters.subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="">All Years</MenuItem>
                {filters.years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Question {currentIndex + 1} of {questions.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <TimerIcon sx={{ mr: 1 }} />
              <Typography>{formatTime(timeLeft)}</Typography>
            </Box>
            <Button
              variant="outlined"
              color={flagged.includes(currentIndex) ? 'warning' : 'primary'}
              startIcon={<FlagIcon />}
              onClick={() => toggleFlag(currentIndex)}
            >
              {flagged.includes(currentIndex) ? 'Unflag' : 'Flag'}
            </Button>
          </Box>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body1" gutterBottom>
              {questions[currentIndex].question_text}
            </Typography>
            <RadioGroup
              value={answers[questions[currentIndex].id] || ''}
              onChange={(e) => handleAnswer(questions[currentIndex].id, e.target.value)}
            >
              {['A', 'B', 'C', 'D'].map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={questions[currentIndex][`option_${option.toLowerCase()}`]}
                />
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            startIcon={<PrevIcon />}
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          {currentIndex === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              endIcon={<CheckIcon />}
              onClick={() => setShowConfirmSubmit(true)}
            >
              Submit Test
            </Button>
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

        <Dialog
          open={showConfirmSubmit}
          onClose={() => setShowConfirmSubmit(false)}
        >
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to submit the test? You cannot change your answers after submission.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConfirmSubmit(false)}>Cancel</Button>
            <Button onClick={submitTest} variant="contained" color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default MCQTest;
