import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../../../services/api';

const UploadQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateQuestions = (questions) => {
    const requiredFields = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'subject', 'topic'];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      for (const field of requiredFields) {
        if (!question[field]) {
          throw new Error(`Row ${i + 2}: Missing ${field}`);
        }
      }
      
      if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer.toUpperCase())) {
        throw new Error(`Row ${i + 2}: Invalid correct answer. Must be A, B, C, or D`);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'csv'].includes(fileExt)) {
      setError('Please upload only Excel (.xlsx) or CSV (.csv) files');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const questions = XLSX.utils.sheet_to_json(worksheet);

          validateQuestions(questions);

          const response = await api.post('/questions/bulk', questions);
          setSuccess(`Successfully uploaded ${questions.length} questions!`);
          event.target.value = '';
        } catch (err) {
          setError(err.message || 'Error processing file');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Error reading file');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        question: 'Sample question text here?',
        optionA: 'Option A',
        optionB: 'Option B',
        optionC: 'Option C',
        optionD: 'Option D',
        correctAnswer: 'A',
        subject: 'Pharmaceutical Chemistry',
        topic: 'Drug Analysis',
        difficulty: 'Medium',
        explanation: 'Explanation for the correct answer'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'question_upload_template.xlsx');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Upload Questions
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            Upload questions in bulk using Excel (.xlsx) or CSV (.csv) format.
            Please ensure your file follows the required format.
          </Typography>
          <Button
            variant="outlined"
            onClick={downloadTemplate}
            sx={{ mb: 2 }}
          >
            Download Template
          </Button>
        </Box>

        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            mb: 3,
            bgcolor: '#fafafa'
          }}
        >
          <input
            accept=".xlsx,.csv"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <Button
              component="span"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Choose File'}
            </Button>
          </label>
          {loading && (
            <Box sx={{ mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default UploadQuestions;
