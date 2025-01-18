import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MCQTest from './components/MCQTest';
import TestResult from './components/TestResult';
import Performance from './components/Performance';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import AdminDashboard from './components/AdminDashboard';
import ManageUsers from './components/ManageUsers';
import ManageQuestions from './components/ManageQuestions';
import EditUser from './components/EditUser';
import EditQuestion from './components/EditQuestion';
import './App.css';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [user_id, setUserId] = useState(null);

  // Check if the user is already authenticated (e.g., from local storage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user details from the backend using the token
      // Example: Call an API to validate the token and get user details
      // setUsername(response.username);
      // setIsAdmin(response.isAdmin);
      // setUserId(response.user_id);
    }
  }, []);

  return (
    <Router>
      <Navbar
        username={username}
        isAdmin={isAdmin}
        setUsername={setUsername}
        setIsAdmin={setIsAdmin}
        setUserId={setUserId}
      />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/test" element={<MCQTest user_id={user_id} />} />
        <Route path="/test-result" element={<TestResult />} />
        <Route path="/performance" element={<Performance user_id={user_id} />} />
        <Route
          path="/signin"
          element={
            <SignIn
              setUsername={setUsername}
              setIsAdmin={setIsAdmin}
              setUserId={setUserId}
            />
          }
        />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/manage-users" element={<ManageUsers />} />
        <Route path="/admin/manage-questions" element={<ManageQuestions />} />
        <Route path="/admin/edit-user/:id" element={<EditUser />} />
        <Route path="/admin/edit-question/:id" element={<EditQuestion />} />
      </Routes>
    </Router>
  );
}

export default App;