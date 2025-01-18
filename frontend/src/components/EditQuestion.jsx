import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchQuestion, updateQuestion, fetchSubjects } from '../api';

const EditQuestion = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState({
    question: '',
    subject_id: '', // Use subject_id instead of subject
    year: '',
    answer: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    degree: 'Bpharm',
  });
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const questionData = await fetchQuestion(id);
        setQuestion(questionData);

        const subjectsData = await fetchSubjects();
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data');
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateQuestion(id, question);
      alert('Question updated successfully');
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question');
    }
  };

  return (
    <div className="edit-question">
      <h1>Edit Question</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Question"
          value={question.question}
          onChange={(e) => setQuestion({ ...question, question: e.target.value })}
        />
        <select
          value={question.subject_id}
          onChange={(e) => setQuestion({ ...question, subject_id: e.target.value })}
        >
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Year"
          value={question.year}
          onChange={(e) => setQuestion({ ...question, year: e.target.value })}
        />
        <input
          type="text"
          placeholder="Answer"
          value={question.answer}
          onChange={(e) => setQuestion({ ...question, answer: e.target.value })}
        />
        <input
          type="text"
          placeholder="Option 1"
          value={question.option1}
          onChange={(e) => setQuestion({ ...question, option1: e.target.value })}
        />
        <input
          type="text"
          placeholder="Option 2"
          value={question.option2}
          onChange={(e) => setQuestion({ ...question, option2: e.target.value })}
        />
        <input
          type="text"
          placeholder="Option 3"
          value={question.option3}
          onChange={(e) => setQuestion({ ...question, option3: e.target.value })}
        />
        <input
          type="text"
          placeholder="Option 4"
          value={question.option4}
          onChange={(e) => setQuestion({ ...question, option4: e.target.value })}
        />
        <select
          value={question.degree}
          onChange={(e) => setQuestion({ ...question, degree: e.target.value })}
        >
          <option value="Bpharm">B.Pharm</option>
          <option value="Dpharm">D.Pharm</option>
          <option value="Both">Both</option>
        </select>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditQuestion;