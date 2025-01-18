import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ username, isAdmin, setUsername, setIsAdmin, setUserId }) => {
  const handleSignOut = () => {
    setUsername('');
    setIsAdmin(false);
    setUserId(null);
    localStorage.removeItem('token'); // Remove token from local storage
  };

  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      {username ? (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/test">MCQ Test</Link>
          <Link to="/performance">Performance</Link>
          {isAdmin && (
            <>
              <Link to="/admin/dashboard">Admin Dashboard</Link>
              <Link to="/admin/manage-users">Manage Users</Link>
              <Link to="/admin/manage-questions">Manage Questions</Link>
            </>
          )}
          <Link to="/" onClick={handleSignOut}>Sign Out</Link>
        </>
      ) : (
        <>
          <Link to="/signin">Sign In</Link>
          <Link to="/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;