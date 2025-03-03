/**
 * MockTestSubmission - A mock implementation that bypasses the API
 * This allows testing the UI flow without relying on the backend
 */
const MockTestSubmission = {
  // Store submitted tests for history
  submittedTests: JSON.parse(localStorage.getItem('mockSubmittedTests') || '[]'),
  lastSubmittedAnswers: JSON.parse(localStorage.getItem('mockLastSubmittedAnswers') || 'null'),
  lastTimeSpent: parseInt(localStorage.getItem('mockLastTimeSpent') || '0'),
  
  /**
   * Submit a test with mock response
   */
  submitTest: async (answers, timeSpent = 60, subject = 'Pharmacology') => {
    // Enhanced logging for submitted answers
    console.log('Mock test submission details:');
    console.log('Total Questions:', Object.keys(answers).length);
    console.log('Question IDs:', Object.keys(answers));
    console.log('Full Answers Object:', JSON.stringify(answers, null, 2));
    
    // Log types of question IDs to check for potential type mismatches
    const questionIdTypes = Object.keys(answers).map(id => typeof id);
    console.log('Question ID Types:', questionIdTypes);

    // Log a warning if question IDs don't match expected format
    const expectedQuestionIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const unexpectedIds = Object.keys(answers).filter(id => !expectedQuestionIds.includes(id));
    if (unexpectedIds.length > 0) {
      console.warn('Unexpected Question IDs detected:', unexpectedIds);
    }

    // Log the attempt
    console.log('Mock test submission with answers:', answers);
    
    // Store the answers for later use
    MockTestSubmission.lastSubmittedAnswers = answers;
    MockTestSubmission.lastTimeSpent = timeSpent;
    
    // Update localStorage
    localStorage.setItem('mockLastSubmittedAnswers', JSON.stringify(answers));
    localStorage.setItem('mockLastTimeSpent', timeSpent.toString());
    
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
    
    // Update localStorage
    localStorage.setItem('mockSubmittedTests', JSON.stringify(MockTestSubmission.submittedTests));
    
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
    // Refresh from localStorage in case it was updated in another tab/window
    MockTestSubmission.submittedTests = JSON.parse(localStorage.getItem('mockSubmittedTests') || '[]');
    return MockTestSubmission.submittedTests || [];
  },
  
  /**
   * Get a specific test by ID
   */
  getTestById: (id) => {
    // Refresh from localStorage
    MockTestSubmission.submittedTests = JSON.parse(localStorage.getItem('mockSubmittedTests') || '[]');
    return MockTestSubmission.submittedTests.find(test => test.id === id) || null;
  },
  
  /**
   * Format time in seconds to a readable format
   */
  formatTime: (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  },

  /**
   * Clear all stored data (useful for testing or when user logs out)
   */
  clearData: () => {
    localStorage.removeItem('mockSubmittedTests');
    localStorage.removeItem('mockLastSubmittedAnswers');
    localStorage.removeItem('mockLastTimeSpent');
    MockTestSubmission.submittedTests = [];
    MockTestSubmission.lastSubmittedAnswers = null;
    MockTestSubmission.lastTimeSpent = 0;
  }
};

// Make it available globally
window.MockTestSubmission = MockTestSubmission;

export default MockTestSubmission;
