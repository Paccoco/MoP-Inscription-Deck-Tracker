import React from 'react';

function UserManagement({ users, pending, error, approveUser, handleRemoveUser }) {
  return (
    <div className="table-card">
      {error && <div className="error">{error}</div>}
      
      <h3>Pending Users</h3>
      <ul>
        {pending.length === 0 && <li>No pending users.</li>}
        {pending.map(u => (
          <li key={u.id}>
            {u.username} <button onClick={() => approveUser(u.id)}>Approve</button>
          </li>
        ))}
      </ul>
      
      <h3>All Users</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.is_admin ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleRemoveUser(u.username)} style={{ color: 'red' }}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;
