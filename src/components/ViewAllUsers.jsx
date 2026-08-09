import React, { useEffect, useState, useMemo } from "react";
import { getUsers } from "../utils/localStore";
import BackButton from "./BackButton";
import "./MarkAttendance.css";
import "./ViewAllUsers.css";

function ViewAllUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isActive = true;
    getUsers().then((savedUsers) => {
      if (isActive) setUsers(savedUsers);
    });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <h1>User Management</h1>
        <BackButton fallback="/admin-dashboard" />
      </header>

      <div className="view-users-container">
        <div className="user-search-row">
          <input
            type="text"
            placeholder="Search by name or ID..."
            className="user-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <p className="empty-state">
            {searchTerm ? "No users match your search." : "No users registered yet."}
          </p>
        ) : (
          <div className="user-cards-grid">
            {filteredUsers.map((user) => (
              <article className="user-card-enhanced" key={user.userId}>
                <div className="user-card-header">
                  <div className="user-avatar-wrapper">
                    {user.capturedImage ? (
                      <img
                        src={user.capturedImage}
                        alt={user.username}
                        className="user-avatar-image"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {getInitials(user.username)}
                      </div>
                    )}
                  </div>
                  <div className="user-header-info">
                    <h2 className="user-name-text">{user.username}</h2>
                    <span className="user-id-badge">{user.userId}</span>
                  </div>
                </div>

                <div className="user-card-body">
                  <div className="user-meta-item">
                    <span className="user-meta-icon">📅</span>
                    <span>
                      Registered:{" "}
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="user-card-footer">
                  <button
                    className="view-profile-btn"
                    onClick={() => {
                      /* Potential for future use: navigate to user details */
                    }}
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default ViewAllUsers;
