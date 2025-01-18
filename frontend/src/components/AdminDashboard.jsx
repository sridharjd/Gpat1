import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from '../api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({ totalUsers: 0, totalQuestions: 0, totalTests: 0 });

  useEffect(() => {
    fetchDashboardData().then((data) => {
      setDashboardData(data);
    });
  }, []);

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{dashboardData.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Questions</h3>
          <p>{dashboardData.totalQuestions}</p>
        </div>
        <div className="stat-card">
          <h3>Total Tests Taken</h3>
          <p>{dashboardData.totalTests}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;