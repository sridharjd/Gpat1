import axios from 'axios';

/**
 * Direct test submission utility for debugging
 * This can be called directly from the browser console
 */
export const directTestSubmit = async () => {
  try {
    // Create a minimal test submission payload
    const payload = {
      test_id: "test_123",
      subject_id: "subject_456",
      time_spent: 60,
      total_questions: 10,
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
    
    console.log('Attempting direct test submission with payload:', payload);
    
    // Make a direct axios call
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
    
    console.log('Direct test submission successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Direct test submission failed:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Server response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    throw error;
  }
};

// Make it available globally for console access
window.directTestSubmit = directTestSubmit;

export default directTestSubmit;
