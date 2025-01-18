import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Auth
export const signIn = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signin`, data);
  return response.data;
};

export const signUp = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, data);
  return response.data;
};

// Subjects
export const fetchSubjects = async () => {
  const response = await axios.get(`${API_BASE_URL}/subjects`);
  return response.data;
};

// Questions
export const fetchQuestions = async () => {
  const response = await axios.get(`${API_BASE_URL}/questions`);
  return response.data;
};

export const fetchQuestion = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/questions/${id}`);
  return response.data;
};

export const updateQuestion = async (id, data) => {
  const response = await axios.put(`${API_BASE_URL}/questions/${id}`, data);
  return response.data;
};

export const deleteQuestion = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/questions/${id}`);
  return response.data;
};

// Users
export const fetchUsers = async () => {
  const response = await axios.get(`${API_BASE_URL}/users`);
  return response.data;
};

export const fetchUser = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/users/${id}`);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await axios.put(`${API_BASE_URL}/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/users/${id}`);
  return response.data;
};

// Dashboard
export const fetchDashboardData = async () => {
  const response = await axios.get(`${API_BASE_URL}/dashboard`);
  return response.data;
};

// Test
export const submitTest = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/test/submit-test`, data);
  return response.data;
};

// Performance
export const fetchPerformance = async (user_id) => {
  const response = await axios.get(`${API_BASE_URL}/performance`, {
    params: { user_id },
  });
  return response.data;
};

export { API_BASE_URL };