import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../api';

const SignIn = ({ setUsername, setIsAdmin, setUserId }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await signIn(formData);
      localStorage.setItem('token', response.token); // Store token in local storage
      setUsername(response.username);
      setIsAdmin(response.isAdmin);
      setUserId(response.user_id);
      navigate('/');
    } catch (error) {
      alert('Invalid username or password');
    }
  };

  return (
    <div className="signin">
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default SignIn;