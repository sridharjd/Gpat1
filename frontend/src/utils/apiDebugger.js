/**
 * API Debugger - A utility for debugging API requests
 * This tool helps diagnose API payload issues by trying different payload formats
 */
import axios from 'axios';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:5000';

// Different payload formats to try
const PAYLOAD_FORMATS = {
  // Format 1: Original format with array of objects
  FORMAT_1: {
    name: 'Original Format (Array of Objects)',
    transform: (testId, subjectId, timeSpent, answers) => ({
      test_id: testId,
      subject_id: subjectId,
      time_spent: timeSpent,
      total_questions: Object.keys(answers).length,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        selected_answer: answer
      }))
    })
  },
  
  // Format 2: Flat structure with answer IDs
  FORMAT_2: {
    name: 'Flat Structure with Answer IDs',
    transform: (testId, subjectId, timeSpent, answers) => ({
      test_id: testId,
      subject_id: subjectId,
      time_spent: timeSpent,
      total_questions: Object.keys(answers).length,
      answers: answers // Pass the answers object directly
    })
  },
  
  // Format 3: Nested structure with questions array
  FORMAT_3: {
    name: 'Nested Structure with Questions Array',
    transform: (testId, subjectId, timeSpent, answers) => ({
      test_id: testId,
      subject_id: subjectId,
      time_spent: timeSpent,
      questions: Object.entries(answers).map(([questionId, answer]) => ({
        id: questionId,
        selected_option: answer
      }))
    })
  },
  
  // Format 4: Simple array of answer objects with different field names
  FORMAT_4: {
    name: 'Simple Array with Different Field Names',
    transform: (testId, subjectId, timeSpent, answers) => ({
      test_id: testId,
      subject_id: subjectId,
      time_spent: timeSpent,
      total_questions: Object.keys(answers).length,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        id: questionId,
        answer: answer
      }))
    })
  },
  
  // Format 5: Camel case instead of snake case
  FORMAT_5: {
    name: 'Camel Case Format',
    transform: (testId, subjectId, timeSpent, answers) => ({
      testId: testId,
      subjectId: subjectId,
      timeSpent: timeSpent,
      totalQuestions: Object.keys(answers).length,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId: questionId,
        selectedAnswer: answer
      }))
    })
  },
  
  // Format 6: Minimal format with just test_id and answers
  FORMAT_6: {
    name: 'Minimal Format',
    transform: (testId, subjectId, timeSpent, answers) => ({
      test_id: testId,
      answers: answers
    })
  }
};

/**
 * Try submitting a test with different payload formats
 */
export const debugApiPayload = async (testId, subjectId, timeSpent, answers) => {
  console.log('Starting API payload debugging...');
  console.log('Input parameters:', { testId, subjectId, timeSpent, answers });
  
  const results = [];
  
  // Try each format
  for (const [formatKey, format] of Object.entries(PAYLOAD_FORMATS)) {
    try {
      console.log(`\n\nTrying ${format.name}...`);
      const payload = format.transform(testId, subjectId, timeSpent, answers);
      console.log('Payload:', payload);
      
      const response = await axios.post(`${API_BASE_URL}/tests/submit`, payload);
      
      console.log('Success!', response.data);
      results.push({
        format: format.name,
        success: true,
        data: response.data
      });
      
      // If we got a successful response, we can stop
      console.log(`Format ${format.name} worked!`);
      break;
    } catch (error) {
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Response data:', error.response.data);
        results.push({
          format: format.name,
          success: false,
          error: error.message,
          data: error.response.data
        });
      } else {
        results.push({
          format: format.name,
          success: false,
          error: error.message
        });
      }
    }
  }
  
  // Log the final results
  console.log('\n\nAPI Debugging Results:');
  results.forEach((result, index) => {
    console.log(`Format ${index + 1} (${result.format}): ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.success) {
      console.log('Response:', result.data);
    } else {
      console.log('Error:', result.error);
      if (result.data) {
        console.log('Response data:', result.data);
      }
    }
    console.log('---');
  });
  
  return results;
};

// Make it available globally
window.debugApiPayload = debugApiPayload;

export default {
  debugApiPayload
};
