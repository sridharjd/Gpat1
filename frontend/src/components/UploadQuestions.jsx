import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api';

const UploadQuestions = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/update_questions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data.message);
      alert('Questions updated successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Failed to upload file.');
      alert('Failed to upload file.');
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label htmlFor="file" className="form-label">
            Upload Excel File
          </label>
          <input
            type="file"
            className="form-control"
            id="file"
            name="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            required
          />
          <div className="form-text">
            The Excel file must have the following columns: year, subject, question, answer, option1, option2, option3, option4, degree.
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          Upload
        </button>
      </form>

      {message && <p className="mt-3">{message}</p>}

      {/* Sample Excel Data Table */}
      <div className="sample-table mt-4">
        <h3 className="my-4">Sample Excel Data</h3>
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>year</th>
              <th>subject</th>
              <th>question</th>
              <th>answer</th>
              <th>option1</th>
              <th>option2</th>
              <th>option3</th>
              <th>option4</th>
              <th>degree</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2020</td>
              <td>Pharmaceutics</td>
              <td>What is the primary mechanism of drug release from a matrix tablet?</td>
              <td>Diffusion</td>
              <td>Diffusion</td>
              <td>Erosion</td>
              <td>Osmosis</td>
              <td>Dissolution</td>
              <td>Bpharm</td>
            </tr>
            <tr>
              <td>2021</td>
              <td>Pharmacology</td>
              <td>Which drug is used to treat hypertension by blocking angiotensin II receptors?</td>
              <td>Losartan</td>
              <td>Losartan</td>
              <td>Propranolol</td>
              <td>Amlodipine</td>
              <td>Warfarin</td>
              <td>Bpharm</td>
            </tr>
            <tr>
              <td>2022</td>
              <td>Pharmacognosy</td>
              <td>What is the main active component of Aloe vera?</td>
              <td>Aloin</td>
              <td>Aloin</td>
              <td>Curcumin</td>
              <td>Quercetin</td>
              <td>Resveratrol</td>
              <td>Dpharm</td>
            </tr>
            <tr>
              <td>2023</td>
              <td>Pharmaceutics</td>
              <td>What is the significance of the Noyes-Whitney equation?</td>
              <td>Describes drug dissolution rate</td>
              <td>Describes drug dissolution rate</td>
              <td>Describes drug absorption rate</td>
              <td>Describes drug excretion rate</td>
              <td>Describes drug metabolism rate</td>
              <td>Both</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UploadQuestions;