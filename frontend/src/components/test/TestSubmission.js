import apiService from '../../services/api';

/**
 * TestSubmission service to handle test submissions
 * This separates the submission logic from the component
 */
export const TestSubmission = {
  /**
   * Submit a test with answers and metadata
   * @param {Object} testData - Test data including answers and metadata
   * @returns {Promise} - Promise with the submission result
   */
  submitTest: async (testData) => {
    try {
      // Create a properly formatted payload for the backend
      const payload = {
        test_id: testData.testId || 'default_test',
        subject_id: testData.subjectId || 'default_subject',
        year: testData.year || new Date().getFullYear().toString(),
        time_spent: Math.max(1, testData.timeSpent || 1),
        total_questions: testData.totalQuestions || 0,
        answers: Array.isArray(testData.answers) 
          ? testData.answers.map(answer => ({
              question_id: answer.questionId,
              selected_answer: answer.selectedAnswer
            }))
          : Object.entries(testData.answers || {}).map(([questionId, selectedAnswer]) => ({
              question_id: questionId,
              selected_answer: selectedAnswer
            }))
      };

      console.log('Formatted test submission payload:', payload);
      
      // Make the API call
      const response = await apiService.tests.submitTestRaw(payload);
      return response.data;
    } catch (error) {
      console.error('Test submission error:', error);
      throw error;
    }
  }
};

export default TestSubmission;
