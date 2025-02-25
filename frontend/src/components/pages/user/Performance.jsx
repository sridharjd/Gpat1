import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Performance = ({ user_id }) => {
  const [performanceData, setPerformanceData] = useState({ labels: [], datasets: [] });
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const response = await api.get(`/performance/${user_id}`);
        const data = response.data;
        
        setPerformanceData({
          labels: data.performance.map((entry) => new Date(entry.test_date).toLocaleDateString()),
          datasets: [
            {
              label: 'Score',
              data: data.performance.map((entry) => entry.score),
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        });

        setSubjectData(data.subjectPerformance);
      } catch (err) {
        setError('Failed to fetch performance data. Please try again later.');
        console.error('Error fetching performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, [user_id]);

  if (loading) {
    return <div>Loading performance data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="performance">
      <h1>Performance Dashboard</h1>
      <h2>Performance Over Time</h2>
      <Line data={performanceData} />
      <h2>Subject-Wise Performance</h2>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Total Attempted</th>
            <th>Correct Answers</th>
            <th>Total Questions</th>
          </tr>
        </thead>
        <tbody>
          {subjectData.map((subject, index) => (
            <tr key={index}>
              <td>{subject.subject}</td>
              <td>{subject.total_attempted}</td>
              <td>{subject.correct_answers}</td>
              <td>{subject.total_questions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Performance;