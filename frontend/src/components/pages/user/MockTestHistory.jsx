import React, { useState } from 'react';
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
  ListItem
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import MockTestSubmission from '../../../components/test/MockTestSubmission';
import ExportUtils from '../../../utils/exportUtils';
import { useAuth } from '../../../hooks/useAuth';

/**
 * MockTestHistory - A mock implementation of the test history component
 * This displays mock test history data without relying on the backend
 */
const MockTestHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  
  // Create mock test history data
  const createMockTestHistory = () => {
    // Get all submitted tests
    const submittedTests = MockTestSubmission.getAllSubmittedTests();
    
    // Convert submitted tests to the format expected by the component
    const submittedTestHistory = submittedTests.map(test => ({
      id: test.id,
      name: test.name,
      subject: test.subject,
      date: test.date,
      score: test.score,
      totalQuestions: test.totalQuestions,
      timeTaken: MockTestSubmission.formatTime(test.timeTaken),
      status: 'Completed'
    }));
    
    // Add some additional mock tests if no tests have been submitted
    const additionalTests = submittedTests.length === 0 ? [
      {
        id: 'mock-test-2',
        name: 'Medicinal Chemistry Basics',
        subject: 'Medicinal Chemistry',
        date: new Date(Date.now() - 86400000 * 7).toLocaleDateString(), // 7 days ago
        score: 65,
        totalQuestions: 20,
        timeTaken: '15m 30s',
        status: 'Completed'
      },
      {
        id: 'mock-test-3',
        name: 'Pharmaceutics Fundamentals',
        subject: 'Pharmaceutics',
        date: new Date(Date.now() - 86400000 * 14).toLocaleDateString(), // 14 days ago
        score: 78,
        totalQuestions: 15,
        timeTaken: '12m 45s',
        status: 'Completed'
      },
      {
        id: 'mock-test-4',
        name: 'Pharmaceutical Analysis',
        subject: 'Pharmaceutical Analysis',
        date: new Date(Date.now() - 86400000 * 21).toLocaleDateString(), // 21 days ago
        score: 82,
        totalQuestions: 25,
        timeTaken: '22m 10s',
        status: 'Completed'
      }
    ] : [];
    
    return [...submittedTestHistory, ...additionalTests];
  };
  
  const mockTests = createMockTestHistory();
  
  // Format time
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ArrowUpwardIcon fontSize="small" /> : 
      <ArrowDownwardIcon fontSize="small" />;
  };
  
  // Handle export menu open
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  // Handle export menu close
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };
  
  // Export functions
  const exportToPDF = () => {
    ExportUtils.exportTestHistoryToPDF(filteredAndSortedTests, user?.name || 'User');
    handleExportMenuClose();
  };
  
  const exportToExcel = () => {
    ExportUtils.exportTestHistoryToExcel(filteredAndSortedTests);
    handleExportMenuClose();
  };
  
  // Filter and sort tests
  const filteredAndSortedTests = mockTests
    .filter(test => {
      // Filter by subject
      if (filterSubject !== 'all' && test.subject !== filterSubject) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !test.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by field
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        default:
          comparison = 0;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Test History (MOCK)
      </Typography>
      
      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
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
            
            <Grid item xs={12} md={4}>
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
            
            <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/test')}
              >
                Take New Test
              </Button>
              <Button 
                variant="contained" 
                onClick={handleExportMenuOpen}
                sx={{ ml: 2 }}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportMenuAnchor}
                open={Boolean(exportMenuAnchor)}
                onClose={handleExportMenuClose}
              >
                <ListItem button onClick={exportToPDF}>
                  <ListItemIcon>
                    <PdfIcon />
                  </ListItemIcon>
                  <ListItemText>PDF</ListItemText>
                </ListItem>
                <ListItem button onClick={exportToExcel}>
                  <ListItemIcon>
                    <ExcelIcon />
                  </ListItemIcon>
                  <ListItemText>Excel</ListItemText>
                </ListItem>
              </Menu>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Test History Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.light' }}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  <Typography variant="subtitle2" color="white">Test Name</Typography>
                  {getSortIcon('name')}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('subject')}>
                  <Typography variant="subtitle2" color="white">Subject</Typography>
                  {getSortIcon('subject')}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('date')}>
                  <Typography variant="subtitle2" color="white">Date</Typography>
                  {getSortIcon('date')}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('score')}>
                  <Typography variant="subtitle2" color="white">Score</Typography>
                  {getSortIcon('score')}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" color="white">Time Taken</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" color="white">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedTests.length > 0 ? (
              filteredAndSortedTests.map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={test.subject} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>{test.date}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${test.score}%`} 
                      size="small" 
                      color={test.score >= 70 ? "success" : test.score >= 50 ? "warning" : "error"} 
                    />
                  </TableCell>
                  <TableCell>{test.timeTaken}</TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      size="small"
                      onClick={() => navigate(`/results/${test.id}`)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">No test history found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default MockTestHistory;
