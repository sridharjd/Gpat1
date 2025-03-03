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

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTests: 0,
    avgTestsPerUser: 0
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
    if (format === 'csv') {
      // Use server-side CSV export
      apiService.admin.exportTestStats('server');
      handleExportClose();
    } else if (format === 'excel') {
      // Client-side Excel export
      const subjectData = testStats.subjectDistribution.map(subject => ({
        Subject: subject.name,
        TestsTaken: subject.value,
        AverageScore: `${subject.averageScore.toFixed(1)}%`
      }));
      exportToExcel(subjectData, 'Test_Statistics');
    } else if (format === 'pdf') {
      // Client-side PDF export
      const subjectData = testStats.subjectDistribution.map(subject => ({
        Subject: subject.name,
        TestsTaken: subject.value,
        AverageScore: `${subject.averageScore.toFixed(1)}%`
      }));
      
      const columns = [
        { key: 'Subject', header: 'Subject' },
        { key: 'TestsTaken', header: 'Tests Taken' },
        { key: 'AverageScore', header: 'Average Score' }
      ];
      
      try {
        exportToPDF(subjectData, columns, 'Test_Statistics');
      } catch (error) {
        console.error('Error generating PDF:', error);
        setError('Failed to generate PDF. Please try another format.');
      }
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.admin.getUsers();
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const usersData = response.data.data;
        setUsers(usersData);
        
        // Calculate active users (if is_active property exists)
        const activeUsersCount = usersData.filter(user => user.is_active).length;
        
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.length,
          activeUsers: activeUsersCount
        }));
        
        console.log('Users fetched successfully:', usersData);
      } else {
        setError('Invalid response format from server');
        console.error('Invalid response format:', response.data);
        // Initialize with empty array to prevent map errors
        setUsers([]);
      }
    } catch (error) {
      setError('Error fetching users');
      console.error('Error fetching users:', error);
      // Initialize with empty array to prevent map errors
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
          totalTests: overall.total_tests || 0,
          // Only update totalUsers if there's actual test data, otherwise keep the value from fetchUsers
          totalUsers: users.total_users > 0 ? users.total_users : prev.totalUsers,
          avgTestsPerUser: users.avg_tests_per_user || 0
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
    fetchUsers();
    fetchTestStats();
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
      <Container sx={{ mt: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

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

      {/* Dashboard Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5">{stats.totalUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SchoolIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5">{stats.activeUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">Active Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5">{stats.totalTests}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Tests Taken</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BarChartIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5">{stats.avgTestsPerUser.toFixed(1)}</Typography>
                  <Typography variant="body2" color="textSecondary">Avg Tests Per User</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
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
                  
                  {/* Tests Per Day */}
                  <Grid item xs={12} md={8}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Tests Taken (Last 7 Days)</Typography>
                        {testStats.testsPerDay.length > 0 ? (
                          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography>
                              Bar chart visualization would go here in a real implementation
                            </Typography>
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
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Subject</TableCell>
                                  <TableCell>Tests Taken</TableCell>
                                  <TableCell>Average Score</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {testStats.subjectDistribution.map((subject, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{subject.name}</TableCell>
                                    <TableCell>{subject.value}</TableCell>
                                    <TableCell>{subject.averageScore.toFixed(1)}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
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