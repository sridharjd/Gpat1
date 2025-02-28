import axios from 'axios';

/**
 * MinimalTestSubmission - A simplified test submission service
 * This uses direct axios calls to avoid any middleware issues
 */
const MinimalTestSubmission = {
  /**
   * Submit a test with minimal data structure
   */
  submitTest: async (rawAnswers) => {
    try {
      // Create the simplest possible payload
      const payload = {
        // Basic required fields
        test_id: "test_123",
        subject_id: "subject_456",
        time_spent: 60,
        total_questions: Object.keys(rawAnswers).length,
        
        // Try a different format for answers
        answers: [
          {
            question_id: "q1",
            selected_answer: "A"
          },
          {
            question_id: "q2",
            selected_answer: "B"
          }
        ]
      };
      
      console.log('Minimal test submission payload:', payload);
      
      // Make a direct axios call to the endpoint
      const response = await axios.post(
        'http://localhost:5000/tests/submit', 
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Minimal test submission error:', error);
      
      // Log the exact error response from the server
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
      
      throw error;
    }
  }
};

export default MinimalTestSubmission;
