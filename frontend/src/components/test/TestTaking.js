import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import TestSubmission from './TestSubmission';

const TestTaking = ({
  questions,
  testId,
  subjectId,
  onComplete,
  timeLimit = 3600, // Default 1 hour
  showTimer = true
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Timer effect
  useEffect(() => {
    if (timeSpent >= timeLimit) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeSpent, timeLimit]);

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const result = await TestSubmission.submitTest({
        testId,
        subjectId,
        timeSpent,
        totalQuestions: questions.length,
        answers
      });

      onComplete?.(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
    }
  };

  const currentQuestionData = questions[currentQuestion];
  const progress = (Object.keys(answers).length / questions.length) * 100;
  const timeLeft = timeLimit - timeSpent;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Progress and Timer */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography>
            Question {currentQuestion + 1} of {questions.length}
          </Typography>
          {showTimer && (
            <Typography>
              Time Left: {TestSubmission.formatTime(timeLeft)}
            </Typography>
          )}
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 1 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Question */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {currentQuestionData.question}
        </Typography>
        <RadioGroup
          value={answers[currentQuestionData.id] || ''}
          onChange={(e) => handleAnswerSelect(currentQuestionData.id, e.target.value)}
        >
          {['A', 'B', 'C', 'D'].map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio />}
              label={currentQuestionData[`option${option}`]}
            />
          ))}
        </RadioGroup>
      </Paper>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          disabled={currentQuestion === 0 || isSubmitting}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
        >
          Previous
        </Button>
        {currentQuestion < questions.length - 1 ? (
          <Button
            variant="contained"
            disabled={isSubmitting}
            onClick={() => setCurrentQuestion(prev => prev + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            onClick={() => setShowConfirmSubmit(true)}
          >
            Submit Test
          </Button>
        )}
      </Box>

      {/* Confirm Submit Dialog */}
      <Dialog
        open={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
      >
        <DialogTitle>Submit Test?</DialogTitle>
        <DialogContent>
          <Typography>
            You have answered {Object.keys(answers).length} out of {questions.length} questions.
            Are you sure you want to submit?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmSubmit(false)}>
            Continue Test
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestTaking; 