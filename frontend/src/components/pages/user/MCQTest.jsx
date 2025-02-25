import React, { useState, useEffect } from 'react';
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
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

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
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ subjects: [], years: [] });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedYear]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await api.get('/tests/filters');
      if (response.data.success) {
        setFilters(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/tests/questions', {
        params: {
          count: 10,
          subject_id: selectedSubject || undefined,
          year: selectedYear || undefined
        }
      });

      if (response.data.success) {
        if (response.data.data && response.data.data.length > 0) {
          setQuestions(response.data.data);
          setCurrentIndex(0);
          setAnswers({});
          setFlagged([]);
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
      setError(error.response?.data?.message || 'Failed to fetch questions. Please try again.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const toggleFlag = (index) => {
    setFlagged(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const submitTest = async () => {
    try {
      if (!user) {
        setError('Please sign in to submit the test.');
        navigate('/signin');
        return;
      }

      if (Object.keys(answers).length === 0) {
        setError('Please answer at least one question before submitting.');
        return;
      }

      const timeTaken = 3600 - timeLeft;
      const response = await api.post('/tests/submit', {
        username: user.username,
        responses: answers,
        timeTaken: timeTaken
      });

      if (response.data.success) {
        const { score, totalQuestions, correctAnswers, incorrectAnswers } = response.data.data;
        
        // Map questions with user answers and correct/incorrect status
        const answeredQuestions = questions.map(q => ({
          ...q,
          userAnswer: answers[q.id] || null,
          isCorrect: answers[q.id] === q.correct_answer
        }));

        navigate('/test-result', {
          state: {
            result: {
              score,
              totalQuestions,
              correctAnswers,
              incorrectAnswers,
              timeSpent: timeTaken,
              questions: answeredQuestions
            }
          }
        });
      } else {
        setError(response.data.message || 'Failed to submit test. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
        navigate('/signin');
      } else {
        setError(error.response?.data?.message || 'Failed to submit test. Please try again.');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
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

        {loading ? (
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : questions.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Question {currentIndex + 1} of {questions.length}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<TimerIcon />}
                  label={`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                  color="primary"
                />
                <Chip
                  icon={<FlagIcon />}
                  label={`Flagged: ${flagged.length}`}
                  color={flagged.includes(currentIndex) ? 'warning' : 'default'}
                  onClick={() => toggleFlag(currentIndex)}
                />
              </Stack>
            </Box>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Subject: {questions[currentIndex].subject_name}
                  </Typography>
                  {questions[currentIndex].year && (
                    <Typography variant="subtitle2" color="textSecondary">
                      Year: {questions[currentIndex].year}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {questions[currentIndex].question_text}
                </Typography>

                <RadioGroup
                  value={answers[questions[currentIndex].id] || ''}
                  onChange={(e) => handleAnswer(questions[currentIndex].id, e.target.value)}
                >
                  <Grid container spacing={2}>
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <Grid item xs={12} sm={6} key={option}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 2,
                            bgcolor: answers[questions[currentIndex].id] === option ? 'action.selected' : 'background.paper'
                          }}
                        >
                          <FormControlLabel
                            value={option}
                            control={<Radio />}
                            label={questions[currentIndex][`option_${option.toLowerCase()}`]}
                            sx={{ width: '100%' }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </CardContent>
            </Card>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                startIcon={<PrevIcon />}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              
              <Button
                variant="contained"
                color="success"
                onClick={() => setShowConfirmSubmit(true)}
              >
                Submit Test
              </Button>

              <Button
                variant="contained"
                endIcon={<NextIcon />}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                disabled={currentIndex === questions.length - 1}
              >
                Next
              </Button>
            </Box>

            <Dialog open={showConfirmSubmit} onClose={() => setShowConfirmSubmit(false)}>
              <DialogTitle>Submit Test?</DialogTitle>
              <DialogContent>
                <Typography>
                  You have answered {Object.keys(answers).length} out of {questions.length} questions.
                  {flagged.length > 0 && ` There are ${flagged.length} flagged questions.`}
                </Typography>
                <Typography color="error" sx={{ mt: 2 }}>
                  Are you sure you want to submit?
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowConfirmSubmit(false)}>
                  Continue Test
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={submitTest}
                  startIcon={<CheckIcon />}
                >
                  Submit Test
                </Button>
              </DialogActions>
            </Dialog>
          </>
        ) : null}
      </Paper>
    </Container>
  );
};

export default MCQTest;
