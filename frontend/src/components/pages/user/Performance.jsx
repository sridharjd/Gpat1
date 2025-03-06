import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  Assessment as AssessmentIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import MockTestSubmission from '../../test/MockTestSubmission';

const MotionCard = motion(Card);
const MotionPaper = motion(Paper);

const CACHE_KEY = 'performanceData';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const timeRanges = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  'ALL': null
};

const Performance = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedRange, setSelectedRange] = useState('1M');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const { on, off, isConnected } = useWebSocket();

  const loadCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setPerformanceData(data);
          setLastUpdated(new Date(timestamp));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading cached data:', error);
      return false;
    }
  }, []);

  const cacheData = useCallback((data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  const transformMockData = (mockTests) => {
    const today = new Date();
    return mockTests.map(test => ({
      date: test.date,
      score: test.score,
      accuracy: (test.correctAnswers / test.totalQuestions) * 100,
      avgTimePerQuestion: Math.round(test.timeTaken / test.totalQuestions),
      subject: test.subject,
      subjectScore: test.score,
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const fetchPerformanceData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError('');

    try {
      // Try to fetch real data first
      const response = await apiService.get('/performance/stats', {
        params: { days: timeRanges[selectedRange] }
      });
      
      const newData = response.data;
      setPerformanceData(newData);
      setLastUpdated(new Date());
      cacheData(newData);
    } catch (err) {
      console.error('Failed to fetch real performance data, falling back to mock:', err);
      
      // Fall back to mock data
      const mockTests = MockTestSubmission.getAllSubmittedTests();
      const transformedData = transformMockData(mockTests);
      
      setPerformanceData(transformedData);
      setLastUpdated(new Date());
      cacheData(transformedData);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, cacheData]);

  useEffect(() => {
    const hasCachedData = loadCachedData();
    if (!hasCachedData) {
      fetchPerformanceData();
    }

    // Subscribe to real-time performance updates
    const handlePerformanceUpdate = (data) => {
      setPerformanceData(prevData => {
        const newData = [...prevData];
        const index = newData.findIndex(item => item.date === data.date);
        
        if (index !== -1) {
          newData[index] = { ...newData[index], ...data };
        } else {
          newData.unshift(data);
        }

        // Keep only the last N days based on selected range
        if (timeRanges[selectedRange]) {
          return newData.slice(0, timeRanges[selectedRange]);
        }
        return newData;
      });
    };

    const subscription = on('PERFORMANCE_UPDATED', handlePerformanceUpdate);

    return () => {
      subscription();
    };
  }, [on, loadCachedData, fetchPerformanceData, selectedRange]);

  const handleRefresh = () => {
    fetchPerformanceData(false);
  };

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    setFilterAnchorEl(null);
    fetchPerformanceData();
  };

  const filteredData = useMemo(() => {
    if (!timeRanges[selectedRange]) return performanceData;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRanges[selectedRange]);
    
    return performanceData.filter(item => 
      new Date(item.date) >= cutoffDate
    );
  }, [performanceData, selectedRange]);

  if (loading && !performanceData.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You are currently offline. Performance updates will be synced when you reconnect.
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Performance Analytics</Typography>
        <Box>
          <Tooltip title="Filter by time range">
            <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {lastUpdated && (
        <Typography variant="caption" color="text.secondary" mb={2} display="block">
          Last updated: {lastUpdated.toLocaleString()}
        </Typography>
      )}

      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        {Object.keys(timeRanges).map(range => (
          <MenuItem
            key={range}
            selected={range === selectedRange}
            onClick={() => handleRangeSelect(range)}
          >
            {range === 'ALL' ? 'All Time' : `Last ${range}`}
          </MenuItem>
        ))}
      </Menu>

      {/* Performance Summary Cards */}
      {performanceData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MotionCard whileHover={{ scale: 1.02 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Average Score</Typography>
                <Typography variant="h4" color="primary">
                  {Math.round(performanceData.reduce((sum, item) => sum + item.score, 0) / performanceData.length)}%
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard whileHover={{ scale: 1.02 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Accuracy</Typography>
                <Typography variant="h4" color="success.main">
                  {Math.round(performanceData.reduce((sum, item) => sum + item.accuracy, 0) / performanceData.length)}%
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard whileHover={{ scale: 1.02 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Avg. Time/Question</Typography>
                <Typography variant="h4">
                  {Math.round(performanceData.reduce((sum, item) => sum + item.avgTimePerQuestion, 0) / performanceData.length)}s
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MotionCard whileHover={{ scale: 1.02 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">Tests Taken</Typography>
                <Typography variant="h4">{performanceData.length}</Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Overall Performance
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Score"
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Accuracy"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Subject Performance
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="subjectScore"
                    stroke="#8884d8"
                    name="Subject Score"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Time Management
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgTimePerQuestion"
                    stroke="#ffc658"
                    name="Avg. Time per Question"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Performance;