import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Layout Components
import Navbar from './components/layout/Navbar';
import ProtectedLayout from './components/layout/ProtectedLayout';

// Auth Pages
import SignIn from './components/pages/auth/SignIn';
import SignUp from './components/pages/auth/SignUp';
import VerifyEmail from './components/pages/auth/VerifyEmail';

// User Pages
import UserDashboard from './components/pages/user/Dashboard';
import Performance from './components/pages/user/Performance';
import TestResult from './components/pages/user/TestResult';
import TestHistory from './components/pages/user/TestHistory';
import MCQTest from './components/pages/user/MCQTest';
import Profile from './components/pages/user/Profile';
import Settings from './components/pages/user/Settings';

// Admin Pages
import AdminDashboard from './components/pages/admin/Dashboard';
import ManageUsers from './components/pages/admin/ManageUsers';
import UploadQuestions from './components/pages/admin/UploadQuestions';

// Public Pages
import Home from './components/pages/public/Home';
import ExamInfo from './components/pages/public/ExamInfo';
import Syllabus from './components/pages/public/Syllabus';
import About from './components/pages/public/About';
import Contact from './components/pages/public/Contact';

// Auth Provider
import { AuthProvider, useAuth } from './hooks/useAuth';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/exam-info" element={<ExamInfo />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Auth Routes */}
        <Route path="/signin" element={
          isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} /> : <SignIn />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} /> : <SignUp />
        } />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* User Routes */}
        <Route element={<ProtectedLayout isAuthenticated={isAuthenticated} isLoading={loading} />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/test" element={<MCQTest />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/test-result" element={<TestResult />} />
          <Route path="/test-history" element={<TestHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Admin Routes */}
        <Route 
          element={
            <ProtectedLayout 
              isAuthenticated={isAuthenticated} 
              isAdmin={true}
              isLoading={loading}
              redirectPath="/dashboard"
            />
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/upload-questions" element={<UploadQuestions />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;