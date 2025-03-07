import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';
import TestTaking from '../../../components/test/TestTaking';

const MotionPaper = motion(Paper);

const MCQTest = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit, isConnected } = useWebSocket();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filters, setFilters] = useState({ subjects: [], years: [] });
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [testStarted, setTestStarted] = useState(false);

  const fetchFilters = useCallback(async () => {
    try {
      const response = await apiService.test.getFilters();
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
      setError(null);
      const response = await apiService.test.getQuestions({
        count: 10,
        subject_id: selectedSubject || undefined,
        year: selectedYear || undefined
      });
      
      console.log('Raw questions response:', response.data.data);
      
      if (response?.data?.success) {
        // Transform the questions data structure
        const transformedQuestions = response.data.data.map(q => {
          console.log('Processing question:', q);
          
          // Handle options object
          let optionsArray = [];
          if (q.options && typeof q.options === 'object') {
            // If options is an object with A, B, C, D keys
            optionsArray = ['A', 'B', 'C', 'D'].map(key => q.options[key]).filter(Boolean);
          } else if (Array.isArray(q.options)) {
            // If options is already an array
            optionsArray = q.options;
          } else {
            // If options are individual fields
            optionsArray = [
              q.option_a || q.optionA,
              q.option_b || q.optionB,
              q.option_c || q.optionC,
              q.option_d || q.optionD
            ].filter(Boolean);
          }

          const transformed = {
            id: q.id,
            question: q.question,
            options: optionsArray,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || q.degree,
            subject: {
              id: q.subject_id || q.subjectId,
              name: q.subject_name || q.subjectName
            }
          };
          console.log('Transformed question:', transformed);
          return transformed;
        });
        
        console.log('Final transformed questions:', transformedQuestions);
        setQuestions(transformedQuestions);
      } else {
        throw new Error('Failed to fetch questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to fetch questions');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to fetch questions',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedYear]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    if (!testStarted) {
      fetchQuestions();
    }
  }, [fetchQuestions, testStarted]);

  const handleTestComplete = async (result) => {
    try {
      console.log('Test completed, received result:', result);
      
      setSnackbar({
        open: true,
        message: 'Test submitted successfully!',
        severity: 'success'
      });

      // Wait for a short delay to show the snackbar
      setTimeout(() => {
        // Navigate to the result page with the correct path
        const path = `/result/${result.resultId}`;
        console.log('Navigating to:', path);
        
        // Navigate directly to the result page
        navigate(path, { 
          state: { result },
          preventScrollReset: true
        });
      }, 1000); // 1 second delay
    } catch (error) {
      console.error('Error navigating to result page:', error);
      setSnackbar({
        open: true,
        message: 'Error navigating to result page',
        severity: 'error'
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading test...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            MCQ Test
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          {!testStarted ? (
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {filters.subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Year"
                >
                  <MenuItem value="">All Years</MenuItem>
                  {filters.years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={() => setTestStarted(true)}
                disabled={!questions.length}
                fullWidth
              >
                Start Test
              </Button>
            </Box>
          ) : (
            <TestTaking
              questions={questions}
              testId={Date.now().toString()}
              subjectId={selectedSubject}
              onComplete={handleTestComplete}
              timeLimit={3600}
              showTimer={true}
            />
          )}
        </Box>
      </MotionPaper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MCQTest; 