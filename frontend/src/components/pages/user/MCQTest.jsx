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
} from '@mui/material';
import {
  Timer as TimerIcon,
  Flag as FlagIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import api from '../../../services/api';

const MCQTest = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

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

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/questions/test');
      setQuestions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const submitTest = async () => {
    try {
      const result = await api.post('/tests/submit', {
        answers,
        timeSpent: 3600 - timeLeft
      });
      navigate('/test-result', { state: { result: result.data } });
    } catch (err) {
      setError('Failed to submit test. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Loading questions...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Return to Dashboard
        </Button>
      </Container>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Practice Test
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<TimerIcon />}
            label={formatTime(timeLeft)}
            color={timeLeft < 300 ? 'error' : 'default'}
          />
          <Chip
            label={`${Object.keys(answers).length}/${questions.length} Answered`}
            color="primary"
          />
          <Chip
            label={`${flagged.length} Flagged`}
            icon={<FlagIcon />}
            color="warning"
          />
        </Box>
      </Box>

      {/* Question Card */}
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary">
              Question {currentIndex + 1} of {questions.length}
            </Typography>
            <Button
              variant={flagged.includes(currentIndex) ? "contained" : "outlined"}
              color="warning"
              startIcon={<FlagIcon />}
              onClick={() => toggleFlag(currentIndex)}
            >
              Flag for Review
            </Button>
          </Box>

          <Typography paragraph>
            {currentQuestion.question}
          </Typography>

          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
          >
            <Grid container spacing={2}>
              {['A', 'B', 'C', 'D'].map((option) => (
                <Grid item xs={12} sm={6} key={option}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2,
                      bgcolor: answers[currentQuestion.id] === option ? 'action.selected' : 'background.paper'
                    }}
                  >
                    <FormControlLabel
                      value={option}
                      control={<Radio />}
                      label={currentQuestion[`option${option}`]}
                      sx={{ width: '100%' }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
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

      {/* Submit Confirmation Dialog */}
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
    </Container>
  );
};

export default MCQTest;
