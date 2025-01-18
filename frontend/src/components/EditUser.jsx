import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchUser, updateUser } from '../api';

const EditUser = () => {
  const { id } = useParams();
  const [user, setUser] = useState({ username: '', is_admin: false });

  useEffect(() => {
    fetchUser(id).then((data) => {
      setUser(data);
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateUser(id, user);
    alert('User updated successfully');
  };

  return (
    <div className="edit-user">
      <h1>Edit User</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={user.username}
          onChange={(e) => setUser({ ...user, username: e.target.value })}
        />
        <label>
          <input
            type="checkbox"
            checked={user.is_admin}
            onChange={(e) => setUser({ ...user, is_admin: e.target.checked })}
          />
          Admin
        </label>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditUser;