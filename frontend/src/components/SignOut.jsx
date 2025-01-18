import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../utils';

const SignOut = ({ setUsername, setIsAdmin, setUserId }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear user data
    setUsername('');
    setIsAdmin(false);
    setUserId(null);

    // Remove token from local storage
    removeToken();

    // Redirect to the home page
    navigate('/');
  }, [navigate, setUsername, setIsAdmin, setUserId]);

  return <div>Signing out...</div>;
};

export default SignOut;