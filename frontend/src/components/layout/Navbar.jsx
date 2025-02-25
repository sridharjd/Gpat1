import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Person,
  ExitToApp,
  Settings,
  Assessment,
  QuestionAnswer,
  SupervisorAccount,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAdmin, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/signin');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const publicPages = [
    { title: 'Home', path: '/' },
    { title: 'Exam Info', path: '/exam-info' },
    { title: 'Syllabus', path: '/syllabus' },
    { title: 'About', path: '/about' },
    { title: 'Contact', path: '/contact' }
  ];

  const adminPages = [
    { title: 'Dashboard', path: '/admin' },
    { title: 'Upload Questions', path: '/admin/upload-questions' },
    { title: 'Manage Users', path: '/admin/users' },
    { title: 'Reports', path: '/admin/reports' }
  ];

  const userPages = [
    { title: 'Dashboard', path: '/dashboard' },
    { title: 'Take Test', path: '/test' },
    { title: 'Performance', path: '/performance' },
  ];

  const menuItems = [
    ...(isAdmin ? adminPages : userPages).map((item) => ({
      label: item.title,
      icon: item.title === 'Dashboard' ? <Dashboard /> : item.title === 'Take Test' ? <Assessment /> : item.title === 'Performance' ? <Assessment /> : item.title === 'Upload Questions' ? <QuestionAnswer /> : item.title === 'Manage Users' ? <SupervisorAccount /> : item.title === 'Reports' ? <Settings /> : null,
      path: item.path,
    })),
  ];

  const profileMenu = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      onClick={handleMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={() => navigate('/profile')}>
        <ListItemIcon>
          <Person fontSize="small" />
        </ListItemIcon>
        Profile
      </MenuItem>
      <MenuItem onClick={() => navigate('/settings')}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        Settings
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <ExitToApp fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  );

  const mobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchor}
      open={Boolean(mobileMenuAnchor)}
      onClose={handleMenuClose}
      onClick={handleMenuClose}
    >
      {menuItems.map((item) => (
        <MenuItem key={item.path} onClick={() => navigate(item.path)}>
          <ListItemIcon>{item.icon}</ListItemIcon>
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );

  return (
    <AppBar position="fixed">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2, display: { md: 'none' } }}
          onClick={handleMobileMenuOpen}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: { xs: 1, md: 0 }, mr: 2 }}
        >
          GPAT Prep
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          {publicPages.map((page) => (
            <Button
              key={page.title}
              onClick={() => handleNavigation(page.path)}
              sx={{ color: 'white', display: 'block' }}
            >
              {page.title}
            </Button>
          ))}
          {isAuthenticated && menuItems.map((item) => (
            <Button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              sx={{ color: 'white', display: 'block' }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {isAuthenticated ? (
            <IconButton
              edge="end"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          ) : (
            <Button
              color="inherit"
              onClick={() => handleNavigation('/signin')}
            >
              Login
            </Button>
          )}
        </Box>

        {isAuthenticated && profileMenu}
        {mobileMenu}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
