import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import TestSubmission from './TestSubmission';

const TestResult = ({ result }) => {
  const {
    score,
    totalQuestions,
    correctAnswers,
    timeSpent,
    answers,
    questions
  } = result;

  const renderScoreCircle = () => (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        width: 200,
        height: 200
      }}
    >
      <CircularProgress
        variant="determinate"
        value={score}
        size={200}
        thickness={4}
        sx={{
          color: score >= 70 ? 'success.main' : score >= 50 ? 'warning.main' : 'error.main'
        }}
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
          flexDirection: 'column'
        }}
      >
        <Typography variant="h4" component="div" color="text.primary">
          {Math.round(score)}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Score
        </Typography>
      </Box>
    </Box>
  );

  const renderStats = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6">{totalQuestions}</Typography>
          <Typography color="text.secondary">Total Questions</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6">{correctAnswers}</Typography>
          <Typography color="text.secondary">Correct Answers</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6">{TestSubmission.formatTime(timeSpent)}</Typography>
          <Typography color="text.secondary">Time Taken</Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderQuestionReview = () => (
    <List>
      {questions.map((question, index) => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;

        return (
          <React.Fragment key={question.id}>
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      Question {index + 1}
                    </Typography>
                    <Chip
                      size="small"
                      color={isCorrect ? 'success' : 'error'}
                      label={isCorrect ? 'Correct' : 'Incorrect'}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body1" gutterBottom>
                      {question.question}
                    </Typography>
                    <Grid container spacing={1}>
                      {['A', 'B', 'C', 'D'].map((option) => (
                        <Grid item xs={12} sm={6} key={option}>
                          <Typography
                            variant="body2"
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              bgcolor: 
                                option === question.correctAnswer
                                  ? 'success.light'
                                  : option === userAnswer && !isCorrect
                                  ? 'error.light'
                                  : 'transparent'
                            }}
                          >
                            {option}. {question[`option${option}`]}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Test Results
      </Typography>

      {/* Score Circle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        {renderScoreCircle()}
      </Box>

      {/* Statistics */}
      <Box sx={{ mb: 4 }}>
        {renderStats()}
      </Box>

      {/* Question Review */}
      <Typography variant="h5" gutterBottom>
        Question Review
      </Typography>
      <Paper elevation={2}>
        {renderQuestionReview()}
      </Paper>
    </Box>
  );
};

export default TestResult; 