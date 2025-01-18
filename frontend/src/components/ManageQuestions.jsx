import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchQuestions, deleteQuestion } from '../api';
import UploadQuestions from './UploadQuestions'; // Import the UploadQuestions component

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions().then((data) => {
      setQuestions(data);
    });
  }, []);

  const handleDeleteQuestion = async (questionId) => {
    try {
      await deleteQuestion(questionId);
      setQuestions(questions.filter((question) => question.id !== questionId));
      alert('Question deleted successfully');
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  return (
    <div className="manage-questions">
      <h1>Manage Questions</h1>

      {/* Add the UploadQuestions component */}
      <UploadQuestions />

      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Subject</th>
            <th>Year</th>
            <th>Degree</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question) => (
            <tr key={question.id}>
              <td>{question.question}</td>
              <td>{question.subject_name}</td>
              <td>{question.year}</td>
              <td>{question.degree}</td>
              <td>
                <button onClick={() => navigate(`/admin/edit-question/${question.id}`)}>Edit</button>
                <button onClick={() => handleDeleteQuestion(question.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageQuestions;