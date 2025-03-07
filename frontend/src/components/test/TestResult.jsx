import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button
} from '@mui/material';
import {
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  Timer as TimerIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const MotionPaper = motion.create(Paper);

const TestResult = ({ result, showBackButton = false, onBack }) => {
  if (!result) {
    return null;
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ py: 4 }}>
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Score
                </Typography>
                <Typography variant="h3" color="primary">
                  {result.score}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.correctAnswers} out of {result.totalQuestions} correct
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Time Taken
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TimerIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h4">
                    {formatTime(result.timeSpent)}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Date
                </Typography>
                <Typography variant="h4">
                  {new Date(result.created_at).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(result.created_at).toLocaleTimeString()}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" gutterBottom>
            Question Review
          </Typography>
          <List>
            {result.questions.map((question, index) => (
              <ListItem
                key={index}
                sx={{
                  mb: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ mr: 1 }}>
                        Question {index + 1}
                      </Typography>
                      {question.isCorrect ? (
                        <Chip
                          icon={<CorrectIcon />}
                          label="Correct"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<IncorrectIcon />}
                          label="Incorrect"
                          color="error"
                          size="small"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body1" paragraph>
                        {question.question}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your answer: {question.userAnswer}
                      </Typography>
                      {!question.isCorrect && (
                        <Typography variant="body2" color="success.main">
                          Correct answer: {question.correctAnswer}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>

          {showBackButton && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                onClick={onBack}
                startIcon={<ArrowBackIcon />}
              >
                Back to Test History
              </Button>
            </Box>
          )}
        </Box>
      </MotionPaper>
    </Box>
  );
};

export default TestResult; 