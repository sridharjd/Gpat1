import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchDashboardData } from '../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [yearData, setYearData] = useState({ labels: [], datasets: [] });
  const [subjectData, setSubjectData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardData();

        // Set data for questions per year chart
        setYearData({
          labels: data.years,
          datasets: [
            {
              label: 'Questions per Year',
              data: data.yearCounts,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        });

        // Set data for questions per subject chart
        setSubjectData({
          labels: data.subjects,
          datasets: [
            {
              label: 'Questions per Subject',
              data: data.subjectCounts,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        });
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="chart-container">
        <h2>Questions per Year</h2>
        <Bar data={yearData} />
      </div>
      <div className="chart-container">
        <h2>Questions per Subject</h2>
        <Bar data={subjectData} />
      </div>
    </div>
  );
};

export default Dashboard;