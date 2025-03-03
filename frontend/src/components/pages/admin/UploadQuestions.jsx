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
import apiService from '../../../services/api';

const UploadQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const validateQuestions = (questions) => {
    if (questions.length === 0) {
      throw new Error('The file contains no data. Please check your file format.');
    }
    
    // Check if the first row has the expected field names
    const firstRow = questions[0];
    const expectedFields = ['question', 'subject', 'year', 'answer', 'option1', 'option2', 'option3', 'option4'];
    const missingFields = expectedFields.filter(field => !Object.keys(firstRow).includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(`The file is missing required columns: ${missingFields.join(', ')}. Please download and use the template.`);
    }
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const rowNumber = i + 2; // Excel row number (1-indexed + header row)
      
      // Check for required fields
      if (!question.question) {
        throw new Error(`Row ${rowNumber}: Missing question`);
      }
      
      if (!question.subject) {
        throw new Error(`Row ${rowNumber}: Missing subject for question: "${question.question.substring(0, 30)}..."`);
      }
      
      if (!question.year) {
        throw new Error(`Row ${rowNumber}: Missing year for question: "${question.question.substring(0, 30)}..."`);
      }
      
      if (!question.answer) {
        throw new Error(`Row ${rowNumber}: Missing answer for question: "${question.question.substring(0, 30)}..."`);
      }
      
      if (!question.option1 || !question.option2 || !question.option3 || !question.option4) {
        throw new Error(`Row ${rowNumber}: Missing one or more options for question: "${question.question.substring(0, 30)}..."`);
      }
      
      // Validate that answer is one of the options
      const answer = question.answer.toString().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(answer)) {
        throw new Error(`Row ${rowNumber}: Invalid answer format. Must be A, B, C, or D for question: "${question.question.substring(0, 30)}..."`);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'csv'].includes(fileExt)) {
      setError('Please upload only Excel (.xlsx) or CSV (.csv) files');
      setSelectedFile(null);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setSelectedFile(file.name);

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

          // Create FormData object for file upload
          const formData = new FormData();
          formData.append('file', file);

          try {
            const response = await apiService.admin.uploadQuestions(formData);
            if (response.data && response.data.success) {
              setSuccess(`Successfully uploaded ${questions.length} questions!`);
            } else {
              setError(response.data?.message || 'Error uploading questions');
            }
            event.target.value = '';
          } catch (apiError) {
            console.error('API Error:', apiError);
            setError(apiError.message || 'Error uploading questions to server');
            setSelectedFile(null);
          }
        } catch (err) {
          setError(err.message || 'Error processing file');
          setSelectedFile(null);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Error reading file');
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        question: 'Sample question text here?',
        option1: 'Option A',
        option2: 'Option B',
        option3: 'Option C',
        option4: 'Option D',
        answer: 'A',
        subject: 'Pharmaceutical Chemistry',
        year: '2023',
        degree: 'B.Pharm' // Optional field
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
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Required fields:</strong> question, option1, option2, option3, option4, answer, subject, year
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Optional fields:</strong> degree
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The answer field must be one of: A, B, C, or D
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
            bgcolor: '#fafafa',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'rgba(25, 118, 210, 0.04)'
            }
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
          {selectedFile && !loading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="primary">
                {selectedFile}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ready to upload
              </Typography>
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
