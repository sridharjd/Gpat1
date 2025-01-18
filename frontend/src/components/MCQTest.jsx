import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import Select from 'react-select';

const MCQTest = ({ user_id }) => {
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const navigate = useNavigate();

  // Fetch subjects and years on component mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [subjectsResponse, yearsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/subjects`),
          axios.get(`${API_BASE_URL}/questions/years`),
        ]);
        setSubjects(subjectsResponse.data);
        setYears(yearsResponse.data);
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };
  
    loadFilters();
  }, []);

  // Fetch questions based on filters
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/questions/filter`, {
          params: {
            subject_id: selectedSubjects.map((s) => s.value).join(','),
            year: selectedYears.map((y) => y.value).join(','),
            user_id,
          },
        });
        console.log('API Response:', response.data); // Debugging
        setQuestions(response.data);
      } catch (err) {
        setError('Failed to fetch questions. Please try again later.');
        console.error('Error fetching questions:', err);
      } finally {
        setLoading(false);
      }
    };
  
    loadQuestions();
  }, [selectedSubjects, selectedYears, user_id]);

  // Convert subjects and years to react-select format
  const subjectOptions = subjects.map((subject) => ({
    value: subject.id,
    label: subject.name,
  }));
  
  const yearOptions = years.map((year) => ({
    value: year,
    label: year.toString(),
  }));

  const handleAnswerChange = (questionId, answer) => {
    setSelectedAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length === 0) {
      alert('Please answer at least one question before submitting.');
      return;
    }
  
    try {
      const result = await axios.post(`${API_BASE_URL}/test/submit-test`, {
        user_id,
        responses: selectedAnswers,
      });
      navigate('/test-result', {
        state: {
          score: result.data.score,
          totalQuestions: result.data.totalQuestions,
          userResponses: selectedAnswers,
          questions, // Ensure questions are passed
        },
      });
    } catch (err) {
      console.error('Error submitting test:', err);
      alert('Failed to submit test. Please try again later.');
    }
  };

  if (loading) {
    return <div>Loading questions...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="mcq-test">
      <h1>MCQ Test</h1>
  
      {/* Filters */}
      <div className="filters">
        <label>
          Subject:
          <Select
            isMulti
            options={subjectOptions}
            value={selectedSubjects}
            onChange={(selected) => setSelectedSubjects(selected)}
          />
        </label>
  
        <label>
          Year:
          <Select
            isMulti
            options={yearOptions}
            value={selectedYears}
            onChange={(selected) => setSelectedYears(selected)}
          />
        </label>
      </div>
  
      {/* Questions */}
      {loading ? (
        <div>Loading questions...</div>
      ) : error ? (
        <div>{error}</div>
      ) : questions.length > 0 ? (
        questions.map((question) => (
          <div key={question.id} className="question-card">
            <div className="question-info">
              <span className="subject-label">Subject: {question.subject_name}</span>
              <span className="year-label">Year: {question.year}</span>
              <span className="attempt-status">
                {question.attempted ? 'Attempted' : 'Not Attempted'}
              </span>
            </div>
            <h3>{question.question}</h3>
            {['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => (
              <div key={index} className="option">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={question[optionKey]}
                  onChange={() => handleAnswerChange(question.id, question[optionKey])}
                />
                <label>{question[optionKey]}</label>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div>No questions available for the selected filters.</div>
      )}
  
      <button onClick={handleSubmit}>Submit Test</button>
    </div>
  );
};

export default MCQTest;