import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Menu,
  Tooltip
} from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import {
  Download as DownloadIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import apiService from '../../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('performance');
  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await apiService.admin.getReports({ type: reportType, range: timeRange });
        setReportData(response.data);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError('Failed to fetch report data.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [reportType, timeRange]);

  const handleExport = async (format = 'excel') => {
    try {
      const response = await apiService.admin.getReportData({ type: reportType, range: timeRange });

      if (format === 'excel') {
        const workbook = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
          ['Report Type', reportType.charAt(0).toUpperCase() + reportType.slice(1)],
          ['Time Range', timeRange.charAt(0).toUpperCase() + timeRange.slice(1)],
          ['Generated Date', new Date().toLocaleString()],
          []
        ];

        if (reportType === 'performance') {
          // Performance Analysis Sheet
          const performanceData = [
            ['Date', 'Average Score', 'Number of Tests', 'Pass Rate', 'Subject-wise Performance'],
            ...response.data.details.map(item => [
              item.date,
              item.averageScore.toFixed(2) + '%',
              item.testCount,
              item.passRate.toFixed(2) + '%',
              Object.entries(item.subjectPerformance)
                .map(([subject, score]) => `${subject}: ${score.toFixed(2)}%`)
                .join(', ')
            ])
          ];

          // User Performance Sheet
          const userPerformanceData = [
            ['Username', 'Tests Taken', 'Average Score', 'Best Score', 'Worst Score', 'Most Challenging Subjects'],
            ...response.data.userPerformance.map(user => [
              user.username,
              user.testsTaken,
              user.averageScore.toFixed(2) + '%',
              user.bestScore.toFixed(2) + '%',
              user.worstScore.toFixed(2) + '%',
              user.challengingSubjects.join(', ')
            ])
          ];

          XLSX.utils.sheet_add_aoa(workbook, summaryData, { origin: 'A1' });
          const ws1 = XLSX.utils.aoa_to_sheet(performanceData);
          const ws2 = XLSX.utils.aoa_to_sheet(userPerformanceData);
          
          // Add sheets to workbook
          XLSX.utils.book_append_sheet(workbook, ws1, 'Performance Data');
          XLSX.utils.book_append_sheet(workbook, ws2, 'User Performance');
        }

        // Download the Excel file
        XLSX.writeFile(workbook, `Report_${reportType}_${timeRange}.xlsx`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report.');
    }
  };

  return (
    <Container>
      <Typography variant="h4">Reports</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Analytics Reports
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="performance">Performance Analysis</MenuItem>
                  <MenuItem value="users">User Statistics</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', height: '56px' }}>
                <Button
                  variant="contained"
                  onClick={() => handleExport('excel')}
                  startIcon={<DownloadIcon />}
                  sx={{ flex: 1, mr: 1 }}
                >
                  Export to Excel
                </Button>
                <Tooltip title="Export Options">
                  <IconButton
                    onClick={handleClick}
                    sx={{ ml: 1 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => {
                    handleExport('csv');
                    handleClose();
                  }}>
                    Export as CSV
                  </MenuItem>
                </Menu>
              </Box>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 400 }}>
              {renderChart()}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Reports;
