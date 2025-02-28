/**
 * MockTestSubmission - A mock implementation that bypasses the API
 * This allows testing the UI flow without relying on the backend
 */
const MockTestSubmission = {
  // Store submitted tests for history
  submittedTests: [],
  lastSubmittedAnswers: null,
  lastTimeSpent: 0,
  
  /**
   * Submit a test with mock response
   */
  submitTest: async (answers, timeSpent = 60, subject = 'Pharmacology') => {
    // Log the attempt
    console.log('Mock test submission with answers:', answers);
    
    // Store the answers for later use
    MockTestSubmission.lastSubmittedAnswers = answers;
    MockTestSubmission.lastTimeSpent = timeSpent;
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock result ID
    const resultId = 'mock-result-' + Math.floor(Math.random() * 1000);
    
    // Count the number of questions
    const totalQuestions = Object.keys(answers).length;
    
    // Generate a random score (but make it somewhat realistic)
    const score = Math.floor(Math.random() * 30) + 50; // Score between 50-80
    
    // Create a test submission record
    const testSubmission = {
      id: resultId,
      name: `${subject} Test ${MockTestSubmission.submittedTests.length + 1}`,
      subject: subject,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      score: score,
      totalQuestions: totalQuestions,
      correctAnswers: Math.floor(totalQuestions * (score / 100)),
      timeTaken: timeSpent,
      answers: { ...answers }
    };
    
    // Add to submitted tests history
    MockTestSubmission.submittedTests.push(testSubmission);
    
    // Return a successful mock response
    return {
      success: true,
      message: 'Test submitted successfully (MOCK)',
      resultId: resultId,
      score: score,
      totalQuestions: totalQuestions,
      correctAnswers: Math.floor(totalQuestions * (score / 100)),
      timeSpent: timeSpent
    };
  },
  
  /**
   * Get the last submitted answers
   */
  getLastSubmittedAnswers: () => {
    return MockTestSubmission.lastSubmittedAnswers || {};
  },
  
  /**
   * Get the last time spent
   */
  getLastTimeSpent: () => {
    return MockTestSubmission.lastTimeSpent || 0;
  },
  
  /**
   * Get all submitted tests
   */
  getAllSubmittedTests: () => {
    return MockTestSubmission.submittedTests || [];
  },
  
  /**
   * Get a specific test by ID
   */
  getTestById: (id) => {
    return MockTestSubmission.submittedTests.find(test => test.id === id) || null;
  },
  
  /**
   * Format time in seconds to a readable format
   */
  formatTime: (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
};

// Make it available globally
window.MockTestSubmission = MockTestSubmission;

export default MockTestSubmission;
