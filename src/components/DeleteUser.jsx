import React, { useEffect, useState } from "react";
import { deleteUser, getUsers } from "../utils/localStore";
import BackButton from "./BackButton";
import "./DeleteUser.css";
import "./MarkAttendance.css";

function DeleteUser() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isActive = true;
    getUsers().then((savedUsers) => {
      if (isActive) setUsers(savedUsers);
    });

    return () => {
      isActive = false;
    };
  }, []);

  const handleDelete = async (userId, username) => {
    const confirmed = window.confirm(`Delete ${username} and their attendance records?`);
    if (!confirmed) return;

    const nextUsers = await deleteUser(userId);
    setUsers(nextUsers);
    setMessage(`${username} was deleted.`);
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <h1>Delete User</h1>
        <BackButton fallback="/admin-dashboard" />
      </header>

      {message && <p className="status-message">{message}</p>}

      {users.length === 0 ? (
        <p className="empty-state">No users registered yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>User ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>{user.username}</td>
                  <td>{user.userId}</td>
                  <td>
                    <button type="button" className="danger-button" onClick={() => handleDelete(user.userId, user.username)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default DeleteUser;
