import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Person as PersonIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import apiService from '../../../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { ErrorBoundary } from 'react-error-boundary';

const RetryableComponent = ({ children, onRetry }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography color="error" gutterBottom>
          Failed to load component
        </Typography>
        <Button onClick={() => {
          setHasError(false);
          onRetry?.();
        }} variant="outlined">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <ErrorBoundary
      fallback={<Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Button onClick={() => setHasError(true)} variant="outlined">
          Retry
        </Button>
      </Box>}
      onError={() => setHasError(true)}
    >
      {children}
    </ErrorBoundary>
  );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    tests: null,
    users: null,
    performance: null,
    dashboard: null,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [testStats, setTestStats] = useState({
    testsPerDay: [],
    subjectDistribution: [],
    averageScore: 0,
    loading: true
  });
  
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  // Export functions
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const exportToExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
    handleExportClose();
  };

  const exportToPDF = (data, columns, filename) => {
    // Create a new jsPDF instance
    const doc = new jsPDF();
    
    // Add title
    doc.text(filename, 14, 16);
    
    // Convert data to format expected by autoTable
    const tableData = data.map(item => columns.map(col => item[col.key]));
    const tableHeaders = columns.map(col => col.header);
    
    // Use autoTable as a plugin
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255
      }
    });
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
    handleExportClose();
  };

  const exportUsers = (format) => {
    if (format === 'csv') {
      // Use server-side CSV export
      apiService.admin.exportUsers('server');
      handleExportClose();
    } else if (format === 'excel') {
      // Client-side Excel export
      const userData = users.map(user => ({
        Username: user.username,
        Email: user.email,
        Role: user.is_admin ? 'Admin' : 'User',
        CreatedAt: new Date(user.created_at).toLocaleDateString()
      }));
      exportToExcel(userData, 'Users_List');
    } else if (format === 'pdf') {
      // Client-side PDF export
      const userData = users.map(user => ({
        Username: user.username,
        Email: user.email,
        Role: user.is_admin ? 'Admin' : 'User',
        CreatedAt: new Date(user.created_at).toLocaleDateString()
      }));
      
      const columns = [
        { key: 'Username', header: 'Username' },
        { key: 'Email', header: 'Email' },
        { key: 'Role', header: 'Role' },
        { key: 'CreatedAt', header: 'Created At' }
      ];
      
      try {
        exportToPDF(userData, columns, 'Users_List');
      } catch (error) {
        console.error('Error generating PDF:', error);
        setError('Failed to generate PDF. Please try another format.');
      }
    }
  };

  const exportTestStats = (format) => {
    try {
      if (format === 'csv') {
        // Use server-side CSV export
        apiService.admin.exportTestStats('server');
        handleExportClose();
      } else if (format === 'excel') {
        // Client-side Excel export
        const testData = testStats.subjectDistribution.map(subject => ({
          Subject: subject.name,
          TestsTaken: subject.value,
          AverageScore: `${subject.averageScore.toFixed(1)}%`,
          PassRate: `${subject.passRate || 0}%`,
          AverageTime: subject.averageTime ? `${Math.round(subject.averageTime / 60)}m ${subject.averageTime % 60}s` : 'N/A'
        }));
        exportToExcel(testData, 'Test_Statistics');
      } else if (format === 'pdf') {
        // Client-side PDF export
        const testData = testStats.subjectDistribution.map(subject => ({
          Subject: subject.name,
          TestsTaken: subject.value,
          AverageScore: `${subject.averageScore.toFixed(1)}%`,
          PassRate: `${subject.passRate || 0}%`,
          AverageTime: subject.averageTime ? `${Math.round(subject.averageTime / 60)}m ${subject.averageTime % 60}s` : 'N/A'
        }));
        
        const columns = [
          { key: 'Subject', header: 'Subject' },
          { key: 'TestsTaken', header: 'Tests Taken' },
          { key: 'AverageScore', header: 'Average Score' },
          { key: 'PassRate', header: 'Pass Rate' },
          { key: 'AverageTime', header: 'Average Time' }
        ];
        
        exportToPDF(testData, columns, 'Test_Statistics');
      }
    } catch (error) {
      console.error('Error exporting test statistics:', error);
      setError('Failed to export test statistics. Please try again.');
    }
  };

  const fetchData = async (fetchFunction, errorMessage) => {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000;
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        const response = await fetchFunction();
        if (!response.data.success) {
          throw new Error(response.data.message || errorMessage);
        }
        return response.data.data;
      } catch (error) {
        retries++;
        if (retries === MAX_RETRIES) {
          console.error(`${errorMessage}:`, error);
          setError(errorMessage);
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY * Math.pow(2, retries - 1)));
      }
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchData(
        () => apiService.admin.getUsers(),
        'Failed to fetch users'
      );
      
      if (Array.isArray(data.data)) {
        const usersData = data.data;
        setUsers(usersData);
        
        const activeUsersCount = usersData.filter(user => user.is_active).length;
        setStats(prev => ({
          ...prev,
          dashboard: {
            ...prev.dashboard,
            totalUsers: usersData.length,
            activeUsers: activeUsersCount
          }
        }));
      }
    } catch (error) {
      setError('Error fetching users');
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestStats = async () => {
    try {
      const response = await apiService.admin.getTestStats();
      if (response.data && response.data.success) {
        const { data } = response.data;
        
        // Extract data from the response
        const overall = data.overall || {};
        const subjects = data.subjects || [];
        const users = data.users || {};
        
        // Format data for charts
        const subjectDistribution = subjects.map(subject => ({
          name: subject.subject_name,
          value: subject.tests_taken,
          averageScore: subject.average_score
        }));
        
        setTestStats({
          testsPerDay: [], // This data is not provided by the endpoint
          subjectDistribution: subjectDistribution,
          averageScore: overall.average_score || 0,
          loading: false
        });
        
        setStats(prev => ({
          ...prev,
          dashboard: {
            ...prev.dashboard,
            totalTests: overall.total_tests || 0,
            // Only update totalUsers if there's actual test data, otherwise keep the value from fetchUsers
            totalUsers: users.total_users > 0 ? users.total_users : prev.dashboard.totalUsers,
            avgTestsPerUser: users.avg_tests_per_user || 0
          }
        }));
      } else {
        console.error('Invalid test stats response:', response.data);
        setTestStats(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching test statistics:', error);
      setTestStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [testStats, userStats, performanceStats, dashboardStats] = await Promise.all([
          apiService.admin.getTestStats(),
          apiService.admin.getUserStats(),
          apiService.admin.getPerformanceStats(),
          apiService.admin.getDashboardStats(),
        ]);

        setStats({
          tests: testStats.data,
          users: userStats.data,
          performance: performanceStats.data,
          dashboard: dashboardStats.data,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSave = async () => {
    try {
      if (selectedUser.id) {
        // Update existing user
        await apiService.admin.updateUser(selectedUser.id, selectedUser);
      } else {
        // Create new user
        await apiService.admin.createUser(selectedUser);
      }
      setSuccess(selectedUser.id ? 'User updated successfully' : 'User created successfully');
      handleClose();
      fetchUsers();
    } catch (error) {
      setError('Error saving user');
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiService.admin.deleteUser(userId);
        setSuccess('User deleted successfully');
        fetchUsers();
      } catch (error) {
        setError('Error deleting user');
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setSelectedUser({
      ...selectedUser,
      [name]: name === 'is_admin' ? checked : value
    });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Users
            </Typography>
            <Typography component="p" variant="h4">
              {stats.dashboard?.totalUsers || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Tests Taken
            </Typography>
            <Typography component="p" variant="h4">
              {stats.dashboard?.totalTests || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Average Score
            </Typography>
            <Typography component="p" variant="h4">
              {stats.dashboard?.averageScore?.toFixed(1) || '0.0'}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Active Users
            </Typography>
            <Typography component="p" variant="h4">
              {stats.dashboard?.activeUsers || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin dashboard tabs">
          <Tab label="User Management" />
          <Tab label="Test Statistics" />
        </Tabs>
      </Box>

      {/* User Management Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">User Management</Typography>
                <Box>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportClick}
                    sx={{ mr: 2 }}
                    disabled={users.length === 0}
                  >
                    Export
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => handleEdit({
                      username: '',
                      email: '',
                      password: '',
                      is_admin: false
                    })}
                  >
                    Add New User
                  </Button>
                </Box>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.is_admin ? 'Admin' : 'User'}</TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <IconButton onClick={() => handleEdit(user)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(user.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Test Statistics Tab */}
      <RetryableComponent onRetry={() => fetchTestStats()}>
        {activeTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Test Statistics</Typography>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<FileDownloadIcon />}
                    onClick={handleExportClick}
                    disabled={testStats.loading || testStats.subjectDistribution.length === 0}
                  >
                    Export
                  </Button>
                </Box>
                {testStats.loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {/* Average Score Card */}
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Average Score</Typography>
                          <Typography variant="h3" color="primary">
                            {testStats.averageScore.toFixed(1)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Tests Per Day Chart */}
                    <Grid item xs={12} md={8}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Tests Taken (Last 7 Days)</Typography>
                          {testStats.testsPerDay.length > 0 ? (
                            <Box sx={{ height: 300 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={testStats.testsPerDay}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Bar dataKey="count" name="Tests Taken" fill="#8884d8" />
                                </BarChart>
                              </ResponsiveContainer>
                            </Box>
                          ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                              <Typography color="textSecondary">No test data available</Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Subject Distribution */}
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Subject Distribution</Typography>
                          {testStats.subjectDistribution.length > 0 ? (
                            <Box>
                              <TableContainer>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Subject</TableCell>
                                      <TableCell align="right">Tests Taken</TableCell>
                                      <TableCell align="right">Average Score</TableCell>
                                      <TableCell align="right">Pass Rate</TableCell>
                                      <TableCell align="right">Average Time</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {testStats.subjectDistribution.map((subject, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{subject.name}</TableCell>
                                        <TableCell align="right">{subject.value}</TableCell>
                                        <TableCell align="right">{subject.averageScore.toFixed(1)}%</TableCell>
                                        <TableCell align="right">{(subject.passRate || 0).toFixed(1)}%</TableCell>
                                        <TableCell align="right">
                                          {subject.averageTime 
                                            ? `${Math.round(subject.averageTime / 60)}m ${subject.averageTime % 60}s`
                                            : 'N/A'
                                          }
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                              <Box sx={{ height: 300, mt: 3 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={testStats.subjectDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="value" name="Tests Taken" fill="#8884d8" />
                                    <Bar yAxisId="right" dataKey="averageScore" name="Average Score" fill="#82ca9d" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                              <Typography color="textSecondary">No subject data available</Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </RetryableComponent>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
      >
        <MenuItem onClick={() => activeTab === 0 ? exportUsers('csv') : exportTestStats('csv')}>
          Export to CSV
        </MenuItem>
        <MenuItem onClick={() => activeTab === 0 ? exportUsers('excel') : exportTestStats('excel')}>
          Export to Excel
        </MenuItem>
        <MenuItem onClick={() => activeTab === 0 ? exportUsers('pdf') : exportTestStats('pdf')}>
          Export to PDF
        </MenuItem>
      </Menu>

      {/* User Edit/Add Dialog */}
      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle>
          {selectedUser && selectedUser.id ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="username"
            label="Username"
            type="text"
            fullWidth
            value={selectedUser ? selectedUser.username : ''}
            onChange={handleChange}
            disabled={selectedUser && selectedUser.id}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            value={selectedUser ? selectedUser.email : ''}
            onChange={handleChange}
          />
          {(!selectedUser || !selectedUser.id) && (
            <TextField
              margin="dense"
              name="password"
              label="Password"
              type="password"
              fullWidth
              value={selectedUser ? selectedUser.password || '' : ''}
              onChange={handleChange}
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={selectedUser ? selectedUser.is_admin : false}
                onChange={handleChange}
                name="is_admin"
              />
            }
            label="Admin"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 