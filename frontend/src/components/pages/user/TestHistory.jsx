import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  ListItem,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Assessment as AssessmentIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import ExportUtils from '../../../utils/exportUtils';

const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const TestHistory = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [testStats, setTestStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [filters, setFilters] = useState({
    subject: 'all',
    status: 'all',
    dateRange: 'all'
  });

  const handleApiError = useCallback((error) => {
    console.error('API Error:', error);
    if (error.response) {
      if (error.response.status === 401) {
        logout();
        return;
      }
      setError('Failed to fetch test history. Please try again later.');
    } else if (error.request) {
      setError('Network error. Please check your connection.');
    } else {
      setError('An unexpected error occurred.');
    }
  }, [logout]);

  const fetchTestHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.tests.getHistory();
      
      if (!response?.data?.success) {
        throw new Error('Failed to fetch test history');
      }

      setTestHistory(response.data.data || []);
    } catch (err) {
      console.error('Error fetching test history:', err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchTestStats = useCallback(async () => {
    try {
      const response = await apiService.tests.getStats();
      
      if (!response?.data?.success) {
        throw new Error('Failed to fetch test statistics');
      }

      setTestStats(response.data.data);
    } catch (err) {
      console.error('Error fetching test statistics:', err);
    }
  }, []);

  useEffect(() => {
    fetchTestHistory();
    fetchTestStats();
  }, [fetchTestHistory, fetchTestStats]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />;
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const exportToPDF = () => {
    handleExportMenuClose();
    ExportUtils.exportToPDF(testHistory, 'Test History');
  };

  const exportToExcel = () => {
    handleExportMenuClose();
    ExportUtils.exportToExcel(testHistory, 'Test History');
  };

  const handleViewResult = (test) => {
    navigate(`/test-result/${test.id}`);
  };

  const filteredTests = testHistory
    .filter(test => {
      const matchesSearch = test.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.score?.toString().includes(searchTerm);
      const matchesSubject = filters.subject === 'all' || test.subject_name === filters.subject;
      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'passed' && test.score >= 70) ||
        (filters.status === 'failed' && test.score < 70);
      return matchesSearch && matchesSubject && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aValue > bValue ? direction : -direction;
    });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button
            variant="contained"
            onClick={fetchTestHistory}
            startIcon={<RefreshIcon />}
          >
            Retry
          </Button>
        </Box>
      )}

      <Typography variant="h4" gutterBottom>
        Test History
      </Typography>

      {/* Summary Cards */}
      {testStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Total Tests</Typography>
                <Typography variant="h4">{testStats.total_tests}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Average Score</Typography>
                <Typography variant="h4" color="success.main">
                  {Math.round(testStats.average_score)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Avg. Time</Typography>
                <Typography variant="h4">
                  {formatTime(testStats.average_time)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Pass Rate</Typography>
                <Typography variant="h4" color="primary">
                  {Math.round(testStats.pass_rate)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              variant="outlined"
              label="Subject"
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Subjects</MenuItem>
              <MenuItem value="Pharmacology">Pharmacology</MenuItem>
              <MenuItem value="Medicinal Chemistry">Medicinal Chemistry</MenuItem>
              <MenuItem value="Pharmaceutics">Pharmaceutics</MenuItem>
              <MenuItem value="Pharmaceutical Analysis">Pharmaceutical Analysis</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              variant="outlined"
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="passed">Passed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleExportMenuOpen}
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <MenuItem onClick={exportToPDF}>
                <ListItemIcon>
                  <PdfIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export as PDF</ListItemText>
              </MenuItem>
              <MenuItem onClick={exportToExcel}>
                <ListItemIcon>
                  <ExcelIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export as Excel</ListItemText>
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
      </Paper>

      {/* Test History Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('subject_name')}>
                  Subject
                  {getSortIcon('subject_name')}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('score')}>
                  Score
                  {getSortIcon('score')}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('time_taken')}>
                  Time Taken
                  {getSortIcon('time_taken')}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('created_at')}>
                  Date
                  {getSortIcon('created_at')}
                </Box>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTests.map((test) => (
              <TableRow key={test.id}>
                <TableCell>{test.subject_name}</TableCell>
                <TableCell>{test.score}%</TableCell>
                <TableCell>{formatTime(test.time_taken)}</TableCell>
                <TableCell>{new Date(test.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={test.score >= 70 ? 'Passed' : 'Failed'}
                    color={test.score >= 70 ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleViewResult(test)}
                    size="small"
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredTests.length === 0 && !loading && (
        <Paper sx={{ p: 3, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No test history found
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default TestHistory;