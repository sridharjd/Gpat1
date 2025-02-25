import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Performance = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState({ labels: [], datasets: [] });
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        if (!user) {
          setError('Please sign in to view performance data');
          setLoading(false);
          return;
        }

        const response = await api.get(`/dashboard/subject-performance`);
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch performance data');
        }

        setSubjectData(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError(err.message || 'Failed to fetch performance data. Please try again later.');
        setLoading(false);
      }
    };

    loadPerformance();
  }, [user]);

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Typography>Loading performance data...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Performance Dashboard</Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Subject-Wise Performance</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Total Questions</TableCell>
                <TableCell align="right">Total Attempted</TableCell>
                <TableCell align="right">Correct Answers</TableCell>
                <TableCell align="right">Accuracy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjectData.map((subject, index) => (
                <TableRow key={index}>
                  <TableCell>{subject.subject}</TableCell>
                  <TableCell align="right">{subject.total_questions}</TableCell>
                  <TableCell align="right">{subject.total_attempted}</TableCell>
                  <TableCell align="right">{subject.correct_answers}</TableCell>
                  <TableCell align="right">{subject.accuracy}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default Performance;