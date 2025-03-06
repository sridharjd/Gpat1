import apiService from '../../services/api';

/**
 * TestSubmission service to handle test submissions and related functionality
 */
export class TestSubmission {
  static #instance = null;
  #lastSubmittedAnswers = null;
  #lastTimeSpent = 0;

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!TestSubmission.#instance) {
      TestSubmission.#instance = new TestSubmission();
    }
    return TestSubmission.#instance;
  }

  /**
   * Validate test data before submission
   */
  #validateTestData(testData) {
    if (!testData || typeof testData !== 'object') {
      throw new Error('Invalid test data format');
    }

    if (!testData.answers || (
      !Array.isArray(testData.answers) && 
      typeof testData.answers !== 'object'
    )) {
      throw new Error('Invalid answers format');
    }

    // Validate required fields
    const requiredFields = ['testId', 'subjectId', 'timeSpent', 'totalQuestions'];
    const missingFields = requiredFields.filter(field => !testData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return true;
  }

  /**
   * Format answers for API submission
   */
  #formatAnswers(answers) {
    if (Array.isArray(answers)) {
      return answers.map(answer => ({
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer
      }));
    }

    return Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      question_id: questionId,
      selected_answer: selectedAnswer
    }));
  }

  /**
   * Submit a test with answers and metadata
   */
  async submitTest(testData) {
    try {
      // Validate input
      this.#validateTestData(testData);

      // Store last submission data
      this.#lastSubmittedAnswers = testData.answers;
      this.#lastTimeSpent = testData.timeSpent;

      // Create payload
      const payload = {
        test_id: testData.testId,
        subject_id: testData.subjectId,
        year: testData.year || new Date().getFullYear().toString(),
        time_spent: Math.max(1, testData.timeSpent),
        total_questions: testData.totalQuestions,
        answers: this.#formatAnswers(testData.answers)
      };

      // Make API call
      const response = await apiService.tests.submitTestRaw(payload);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Test submission failed');
      }

      return response.data;
    } catch (error) {
      console.error('Test submission error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to submit test'
      );
    }
  }

  /**
   * Get the last submitted answers
   */
  getLastSubmittedAnswers() {
    return this.#lastSubmittedAnswers;
  }

  /**
   * Get the last time spent
   */
  getLastTimeSpent() {
    return this.#lastTimeSpent;
  }

  /**
   * Format time in seconds to readable format
   */
  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

export default TestSubmission.getInstance();
