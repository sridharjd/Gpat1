// Mock data service for test submissions
const mockTestSubmissions = [
  {
    id: 1,
    name: 'Mock Test 1',
    subject: 'Pharmacology',
    date: new Date(2024, 2, 1).toISOString(),
    score: 85,
    totalQuestions: 100,
    timeTaken: 3600,
    status: 'Passed'
  },
  {
    id: 2,
    name: 'Mock Test 2',
    subject: 'Medicinal Chemistry',
    date: new Date(2024, 2, 2).toISOString(),
    score: 65,
    totalQuestions: 100,
    timeTaken: 3200,
    status: 'Failed'
  },
  {
    id: 3,
    name: 'Mock Test 3',
    subject: 'Pharmaceutics',
    date: new Date(2024, 2, 3).toISOString(),
    score: 92,
    totalQuestions: 100,
    timeTaken: 2800,
    status: 'Passed'
  }
];

const mockData = {
  getAllSubmittedTests: () => mockTestSubmissions,
  
  getTestById: (id) => mockTestSubmissions.find(test => test.id === id),
  
  getTestStats: () => ({
    totalTests: mockTestSubmissions.length,
    averageScore: Math.round(
      mockTestSubmissions.reduce((sum, test) => sum + test.score, 0) / mockTestSubmissions.length
    ),
    passRate: Math.round(
      (mockTestSubmissions.filter(test => test.score >= 70).length / mockTestSubmissions.length) * 100
    ),
    totalTime: mockTestSubmissions.reduce((sum, test) => sum + test.timeTaken, 0)
  })
};

export default mockData; 