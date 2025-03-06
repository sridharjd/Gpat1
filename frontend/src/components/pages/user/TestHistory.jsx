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
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import apiService from '../../../services/api';
import MockTestSubmission from '../../test/MockTestSubmission';
import mockData from '../../../services/mockData';
import ExportUtils from '../../../utils/exportUtils';
import { useAuth } from '../../../contexts/AuthContext';

const MotionCard = motion(Card);
const MotionPaper = motion(Paper);

const TestHistory = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchTestHistory();
    fetchTestStats();
  }, []);

  const fetchTestHistory = async () => {
    setLoading(true);
    setError('');

    try {
      // Try to fetch real test history
      const response = await apiService.tests.getHistory();
      setTests(response.data);
      console.log('Test history fetched successfully:', response.data);
    } catch (err) {
      console.error('Failed to fetch test history:', err);
      setError('Failed to load test history. Please try again later.');
      // Only use mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data in development mode');
        const mockTests = mockData.getAllSubmittedTests();
        setTests(mockTests);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTestStats = async () => {
    try {
      const response = await apiService.tests.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch test stats:', err);
      setError('Failed to load test statistics.');
      // Only use mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data in development mode');
        setStats(mockData.getTestStats());
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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
    return sortDirection === 'asc' ? 
      <ArrowUpwardIcon fontSize="small" /> : 
      <ArrowDownwardIcon fontSize="small" />;
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const exportToPDF = () => {
    ExportUtils.exportTestHistoryToPDF(filteredAndSortedTests, user?.name || 'User');
    handleExportMenuClose();
  };

  const exportToExcel = () => {
    ExportUtils.exportTestHistoryToExcel(filteredAndSortedTests);
    handleExportMenuClose();
  };

  const handleViewResult = (test) => {
    navigate(`/test-result/${test.id}`);
  };

  // Filter and sort tests
  const filteredAndSortedTests = tests
    .filter(test => {
      if (filterSubject !== 'all' && test.subject !== filterSubject) {
        return false;
      }
      if (searchTerm && !test.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        case 'date':
          comparison = new Date(b.date) - new Date(a.date);
          break;
        case 'score':
          comparison = b.score - a.score;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? -comparison : comparison;
    });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading test history...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <MotionPaper
        elevation={3}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        sx={{ p: 4 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">Test History</Typography>
          <Button
            variant="contained"
            onClick={handleExportMenuOpen}
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: 2 }}
          >
            Export
          </Button>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MotionCard
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Total Tests</Typography>
                  <Typography variant="h4" color="primary">{stats.totalTests}</Typography>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Average Score</Typography>
                  <Typography variant="h4" color="success.main">{stats.averageScore}%</Typography>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Total Time</Typography>
                  <Typography variant="h4">{formatTime(stats.totalTime)}</Typography>
                </CardContent>
              </MotionCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <MotionCard
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: theme.shadows[8] }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">Pass Rate</Typography>
                  <Typography variant="h4" color="primary">{stats.passRate}%</Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search Tests"
                  variant="outlined"
                  size="small"
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
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Filter by Subject"
                  variant="outlined"
                  size="small"
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
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
            </Grid>
          </CardContent>
        </Card>

        {/* Test History Table */}
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Test Name {getSortIcon('name')}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('subject')}>
                    Subject {getSortIcon('subject')}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('date')}>
                    Date {getSortIcon('date')}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('score')}>
                    Score {getSortIcon('score')}
                  </Box>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedTests
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((test) => (
                  <TableRow key={test.id} hover>
                    <TableCell>{test.name}</TableCell>
                    <TableCell>{test.subject}</TableCell>
                    <TableCell>{new Date(test.date).toLocaleDateString()}</TableCell>
                    <TableCell>{test.score}%</TableCell>
                    <TableCell>
                      <Chip
                        label={test.status}
                        color={test.status === 'Passed' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewResult(test)} color="primary">
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Export Menu */}
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
      </MotionPaper>
    </Container>
  );
};

export default TestHistory;