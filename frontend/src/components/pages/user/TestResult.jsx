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
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import {
  Check as CorrectIcon,
  Close as WrongIcon,
  Timer as TimerIcon,
  TrendingUp as ScoreIcon,
  Assessment as AssessmentIcon,
  School as SubjectIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

const TestResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  useEffect(() => {
    if (!result) {
      console.error('No result found, redirecting to dashboard.');
      navigate('/dashboard');
    }
  }, [result, navigate]);

  if (!result) {
    return <Typography variant="h6">No result found. Redirecting...</Typography>;
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

  const exportToExcel = () => {
    const data = [
      ['Test Results Summary'],
      ['Score', `${score}%`],
      ['Total Questions', totalQuestions],
      ['Correct Answers', correctAnswers],
      ['Incorrect Answers', incorrectAnswers],
      ['Time Spent', formatTime(timeSpent)],
      [],
      ['Question-wise Analysis'],
      ['Question', 'Subject', 'Your Answer', 'Correct Answer', 'Status']
    ];

    // Add question-wise data
    questions.forEach((q, index) => {
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

    // Create a worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Export to Excel
    XLSX.writeFile(workbook, 'TestResults.xlsx');
  };

  return (
    <Container>
      <Paper>
        <Typography variant="h4">Test Result</Typography>
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={exportToExcel} startIcon={<DownloadIcon />}>
            Export to Excel
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Score</Typography>
                <Typography variant="h4">{score}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Questions</Typography>
                <Typography variant="h4">{totalQuestions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Correct Answers</Typography>
                <Typography variant="h4">{correctAnswers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Incorrect Answers</Typography>
                <Typography variant="h4">{incorrectAnswers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6">Time Spent</Typography>
                <Typography variant="h4">{formatTime(timeSpent)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default TestResult;