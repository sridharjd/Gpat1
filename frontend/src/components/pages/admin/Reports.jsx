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
  Button
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
  Tooltip,
  Legend
} from 'chart.js';
import api from '../../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('performance');
  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [reportType, timeRange]);

  const fetchReportData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/admin/reports', {
        params: { type: reportType, range: timeRange }
      });
      setReportData(response.data);
    } catch (err) {
      setError('Failed to fetch report data');
      console.error('Report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/reports/export', {
        params: { type: reportType, range: timeRange },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export report');
    }
  };

  const renderChart = () => {
    if (!reportData) return null;

    const commonOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        },
      },
    };

    switch (reportType) {
      case 'performance':
        return (
          <Line
            data={{
              labels: reportData.labels,
              datasets: [
                {
                  label: 'Average Score',
                  data: reportData.averageScores,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1,
                },
                {
                  label: 'Number of Tests',
                  data: reportData.testCounts,
                  borderColor: 'rgb(255, 99, 132)',
                  tension: 0.1,
                },
              ],
            }}
            options={commonOptions}
          />
        );

      case 'users':
        return (
          <Bar
            data={{
              labels: reportData.labels,
              datasets: [
                {
                  label: 'New Users',
                  data: reportData.newUsers,
                  backgroundColor: 'rgba(53, 162, 235, 0.5)',
                },
                {
                  label: 'Active Users',
                  data: reportData.activeUsers,
                  backgroundColor: 'rgba(75, 192, 192, 0.5)',
                },
              ],
            }}
            options={commonOptions}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
              <Button
                variant="contained"
                onClick={handleExport}
                fullWidth
                sx={{ height: '56px' }}
              >
                Export Report
              </Button>
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
