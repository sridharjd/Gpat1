/**
 * This is a simple test file to verify the TestSubmission service works correctly.
 * You can run this file directly in the browser console to test the submission.
 */

import TestSubmission from './TestSubmission';

// Sample test data
const sampleTestData = {
  testId: 'test-123',
  subjectId: 'subject-456',
  year: '2024',
  timeSpent: 300,
  totalQuestions: 10,
  answers: {
    'q1': 'A',
    'q2': 'B',
    'q3': 'C'
  }
};

// Function to test the submission
const testSubmission = async () => {
  try {
    console.log('Testing submission with sample data:', sampleTestData);
    const result = await TestSubmission.submitTest(sampleTestData);
    console.log('Submission successful:', result);
    return result;
  } catch (error) {
    console.error('Submission test failed:', error);
    throw error;
  }
};

// Export the test function
export { testSubmission };

// Log instructions for testing in the console
console.log(`
To test the TestSubmission service, run the following in your browser console:
  
  import { testSubmission } from './components/test/TestSubmissionTest';
  testSubmission().then(result => console.log('Test result:', result));
`);
