import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Layout Components
import Navbar from './components/layout/Navbar';
import ProtectedLayout from './components/layout/ProtectedLayout';

// Auth Pages
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import VerifyEmail from './components/auth/VerifyEmail';

// User Pages
import UserDashboard from './components/pages/user/Dashboard';
import MockDashboard from './components/pages/user/MockDashboard';
import Performance from './components/pages/user/Performance';
import MockPerformance from './components/pages/user/MockPerformance';
import TestResult from './components/pages/user/TestResult';
import MockTestResult from './components/pages/user/MockTestResult';
import TestHistory from './components/pages/user/TestHistory';
import MockTestHistory from './components/pages/user/MockTestHistory';
import MCQTest from './components/pages/user/MCQTest';
import Profile from './components/pages/user/Profile';
import Settings from './components/pages/user/Settings';

// Admin Pages
import AdminDashboard from './components/pages/admin/AdminDashboard';
import UploadQuestions from './components/pages/admin/UploadQuestions';

// Public Pages
import Home from './components/pages/public/Home';
import Syllabus from './components/pages/public/Syllabus';
import About from './components/pages/public/About';
import Contact from './components/pages/public/Contact';

// Auth Provider
import AuthProvider, { useAuth } from './hooks/useAuth';

// Import test utilities for global access
import './components/test';

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [isAdminState, setIsAdminState] = useState(false);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Auth Routes */}
        <Route path="/signin" element={
          isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} /> : 
          <SignIn setIsAuthenticated={setIsAuthenticatedState} setUsername={setUsername} setIsAdmin={setIsAdminState} setUserId={setUserId} />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} /> : <SignUp />
        } />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* User Routes */}
        <Route element={<ProtectedLayout isAuthenticated={isAuthenticated} isAdmin={isAdmin} isLoading={loading} />}>
          <Route path="/dashboard" element={<MockDashboard />} />
          <Route path="/test" element={<MCQTest />} />
          <Route path="/performance" element={<MockPerformance />} />
          <Route path="/test-result" element={<TestResult />} />
          <Route path="/results/:resultId" element={<MockTestResult />} />
          <Route path="/test-history" element={<MockTestHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedLayout isAdmin={true} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/upload-questions" element={<UploadQuestions />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;