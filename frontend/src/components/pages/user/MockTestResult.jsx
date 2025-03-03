import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import MockTestSubmission from '../../../components/test/MockTestSubmission';

// Sample question bank for mock questions
const QUESTION_BANK = {
  '1': 'What is the primary site of drug metabolism in the body?',
  '2': 'Which of the following is NOT a beta-blocker?',
  '3': 'What is the mechanism of action of ACE inhibitors?',
  '4': 'Which antibiotic class is associated with tendon rupture as a side effect?',
  '5': 'What is the half-life of a drug that follows first-order kinetics?',
  '6': 'Which of the following is a selective COX-2 inhibitor?',
  '7': 'What is the primary route of elimination for water-soluble drugs?',
  '8': 'Which of the following is a prodrug?',
  '9': 'What is the mechanism of action of benzodiazepines?',
  '10': 'Which of the following is NOT a calcium channel blocker?'
};

// Sample answer options for mock answers
const ANSWER_OPTIONS = {
  '1': { 'A': 'Liver', 'B': 'Kidney', 'C': 'Intestine', 'D': 'Lungs' },
  '2': { 'A': 'Metoprolol', 'B': 'Amlodipine', 'C': 'Propranolol', 'D': 'Atenolol' },
  '3': { 'A': 'Blocks angiotensin II receptors', 'B': 'Inhibits angiotensin converting enzyme', 'C': 'Blocks calcium channels', 'D': 'Inhibits renin production' },
  '4': { 'A': 'Penicillins', 'B': 'Fluoroquinolones', 'C': 'Macrolides', 'D': 'Cephalosporins' },
  '5': { 'A': 'Time to eliminate 50% of the drug', 'B': 'Time to reach peak plasma concentration', 'C': 'Time to reach steady state', 'D': 'Time to complete absorption' },
  '6': { 'A': 'Aspirin', 'B': 'Celecoxib', 'C': 'Ibuprofen', 'D': 'Naproxen' },
  '7': { 'A': 'Biliary excretion', 'B': 'Renal excretion', 'C': 'Pulmonary excretion', 'D': 'Fecal excretion' },
  '8': { 'A': 'Lisinopril', 'B': 'Enalapril', 'C': 'Amlodipine', 'D': 'Furosemide' },
  '9': { 'A': 'Inhibition of GABA reuptake', 'B': 'Enhancement of GABA activity', 'C': 'Blocking of dopamine receptors', 'D': 'Inhibition of acetylcholinesterase' },
  '10': { 'A': 'Nifedipine', 'B': 'Verapamil', 'C': 'Losartan', 'D': 'Diltiazem' }
};

// Correct answers for the mock questions
const CORRECT_ANSWERS = {
  '1': 'A', // Liver
  '2': 'B', // Amlodipine
  '3': 'B', // Inhibits angiotensin converting enzyme
  '4': 'B', // Fluoroquinolones
  '5': 'A', // Time to eliminate 50% of the drug
  '6': 'B', // Celecoxib
  '7': 'B', // Renal excretion
  '8': 'B', // Enalapril
  '9': 'B', // Enhancement of GABA activity
  '10': 'C' // Losartan
};

/**
 * Format seconds into a readable time format (mm:ss)
 */
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * MockTestResult - A mock test result component
 * This displays mock test results without relying on the backend
 */
const MockTestResult = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call
    const fetchMockTestResult = async () => {
      setLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if we have a result ID from the URL
      if (resultId) {
        // Try to get the test by ID
        const test = MockTestSubmission.getTestById(resultId);

        if (test) {
          // We have a specific test result
          setTestResult({
            id: test.id,
            score: test.score,
            totalQuestions: test.totalQuestions,
            correctAnswers: test.correctAnswers,
            timeSpent: test.timeTaken,
            answers: test.answers,
            date: test.date
          });
          setLoading(false);
          return;
        }
      }

      // If no result ID or test not found, use the last submitted test
      const lastAnswers = MockTestSubmission.getLastSubmittedAnswers();
      const hasSubmittedTest = Object.keys(lastAnswers).length > 0;

      if (hasSubmittedTest) {
        // Create mock test result data
        setTestResult({
          id: 'mock-result-1',
          score: 72,
          totalQuestions: Object.keys(lastAnswers).length,
          correctAnswers: Math.floor(Object.keys(lastAnswers).length * 0.7),
          timeSpent: MockTestSubmission.getLastTimeSpent(),
          answers: lastAnswers,
          date: new Date().toLocaleDateString()
        });
      } else {
        // No test has been submitted, show error
        setError('No test result found. Please take a test first.');
      }

      setLoading(false);
    };

    fetchMockTestResult();
  }, [resultId]);

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

  if (!testResult) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load test results. The test may not exist or you may not have permission to view it.</Alert>
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>Test Results (MOCK)</Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Result ID: {testResult.id}
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6">Score</Typography>
              <Typography variant="h3" color="primary">{testResult.score}%</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6">Correct Answers</Typography>
              <Typography variant="h3" color="success.main">{testResult.correctAnswers}/{testResult.totalQuestions}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6">Time Taken</Typography>
              <Typography variant="h3">{formatTime(testResult.timeSpent)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Question Analysis</Typography>
        <Divider sx={{ mb: 2 }} />

        <List>
          {(() => {
            // Diagnostic logging for test result answers
            console.log('Test Result Answers Object:', testResult.answers);
            console.log('Total Questions in Result:', Object.keys(testResult.answers).length);
            console.log('Question IDs in Result:', Object.keys(testResult.answers));
            
            // Log types of question IDs to check for potential type mismatches
            const questionIdTypes = Object.keys(testResult.answers).map(id => typeof id);
            console.log('Question ID Types in Result:', questionIdTypes);

            return Object.keys(testResult.answers).map((questionId, index) => (
              <React.Fragment key={questionId}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" component="span">
                          Question {questionId}: {QUESTION_BANK[questionId] || `Question ${questionId}`}
                        </Typography>
                        {testResult.answers[questionId] === CORRECT_ANSWERS[questionId] ? (
                          <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                        ) : (
                          <CancelIcon color="error" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Box sx={{ mt: 1 }}>
                          <Typography component="span" variant="body2" color="text.primary">
                            Your Answer: 
                          </Typography>
                          <Chip 
                            label={`${testResult.answers[questionId]}: ${ANSWER_OPTIONS[questionId]?.[testResult.answers[questionId]] || testResult.answers[questionId]}`} 
                            color={testResult.answers[questionId] === CORRECT_ANSWERS[questionId] ? "success" : "error"}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        {testResult.answers[questionId] !== CORRECT_ANSWERS[questionId] && (
                          <Box sx={{ mt: 1 }}>
                            <Typography component="span" variant="body2" color="text.primary">
                              Correct Answer: 
                            </Typography>
                            <Chip 
                              label={`${CORRECT_ANSWERS[questionId]}: ${ANSWER_OPTIONS[questionId]?.[CORRECT_ANSWERS[questionId]] || CORRECT_ANSWERS[questionId]}`} 
                              color="primary"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        )}
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < Object.keys(testResult.answers).length - 1 && <Divider component="li" />}
              </React.Fragment>
            ));
          })()}
        </List>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/test')}
          >
            Take Another Test
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default MockTestResult;
