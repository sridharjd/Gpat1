import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import apiService from '../../../services/api';

const TestHistory = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchTestHistory();
    fetchTestStats();
  }, []);

  const fetchTestHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.tests.getHistory();
      setTests(response.data);
      console.log('Test history fetched successfully:', response.data);
    } catch (err) {
      setError('Failed to fetch test history');
      console.error('Test history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestStats = async () => {
    try {
      const response = await apiService.tests.getStats();
      setStats(response.data);
      console.log('Test stats fetched successfully:', response.data);
    } catch (err) {
      console.error('Test stats error:', err);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleShowDetails = (test) => {
    setSelectedTest(test);
    setShowDetails(true);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container>
      <Paper>
        <Typography variant="h4">Test History</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>{new Date(test.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={test.status} color={test.status === 'Passed' ? 'success' : 'error'} />
                  </TableCell>
                  <TableCell>{test.score}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleShowDetails(test)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={tests.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default TestHistory;