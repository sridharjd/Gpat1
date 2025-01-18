import React from 'react';
import { useLocation } from 'react-router-dom';

const TestResult = () => {
  const location = useLocation();
  console.log('Location State:', location.state); // Log the location state

  const { score, totalQuestions, userResponses, questions = [] } = location.state || {
    score: 0,
    totalQuestions: 0,
    userResponses: {},
    questions: [],
  };

  return (
    <div className="test-result">
      <h1>Test Result</h1>
      <p>Your Score: {score} / {totalQuestions}</p>
      <h2>Detailed Result Report</h2>
      {questions.map((question) => (
        <div key={question.id} className="response-card">
          <h3>Question {question.id}</h3>
          <p>{question.question}</p>
          {['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => (
            <div
              key={index}
              className={`option ${
                userResponses[question.id] === question[optionKey]
                  ? question[optionKey] === question.answer
                    ? 'correct'
                    : 'wrong'
                  : ''
              }`}
            >
              <input
                type="radio"
                name={`question_${question.id}`}
                value={question[optionKey]}
                checked={userResponses[question.id] === question[optionKey]}
                readOnly
              />
              <label>{question[optionKey]}</label>
              {question[optionKey] === question.answer && (
                <span className="correct-answer"> (Correct Answer)</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TestResult;