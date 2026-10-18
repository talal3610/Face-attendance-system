import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import BackButton from "./BackButton";
import { getCurrentUser, getUsers, updateUserPassword } from "../utils/localStore";
import { validateAdminPassword } from "../utils/adminCredentials";
import "./MarkAttendance.css";
import "./ManagePasswords.css";

function ManagePasswords() {
  const currentUser = getCurrentUser();
  const [adminPassword, setAdminPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [users, setUsers] = useState([]);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [newPasswords, setNewPasswords] = useState({});
  const [confirmPasswords, setConfirmPasswords] = useState({});
  const [rowMessages, setRowMessages] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (currentUser?.userId !== "admin") {
    return <Navigate to="/" replace />;
  }

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateAdminPassword(adminPassword)) {
      setError("That admin password is incorrect.");
      return;
    }

    setIsLoading(true);
    try {
      const savedUsers = await getUsers();
      setUsers(savedUsers);
      setIsVerified(true);
      setAdminPassword("");
    } catch (loadError) {
      console.error("Unable to load user passwords:", loadError);
      setError("Unable to load user accounts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = (userId) => {
    setVisiblePasswords((current) => ({ ...current, [userId]: !current[userId] }));
  };

  const handlePasswordChange = async (user) => {
    const nextPassword = newPasswords[user.userId] || "";
    const confirmPassword = confirmPasswords[user.userId] || "";

    if (!nextPassword.trim()) {
      setRowMessages((current) => ({ ...current, [user.userId]: { error: "Enter a new password." } }));
      return;
    }
    if (nextPassword !== confirmPassword) {
      setRowMessages((current) => ({ ...current, [user.userId]: { error: "The passwords do not match." } }));
      return;
    }

    setRowMessages((current) => ({ ...current, [user.userId]: { loading: true } }));
    try {
      const updatedUser = await updateUserPassword(user.userId, nextPassword);
      setUsers((current) => current.map((item) => item.userId === user.userId ? updatedUser : item));
      setNewPasswords((current) => ({ ...current, [user.userId]: "" }));
      setConfirmPasswords((current) => ({ ...current, [user.userId]: "" }));
      setVisiblePasswords((current) => ({ ...current, [user.userId]: false }));
      setRowMessages((current) => ({ ...current, [user.userId]: { success: "Password updated." } }));
    } catch (updateError) {
      console.error("Unable to update user password:", updateError);
      setRowMessages((current) => ({ ...current, [user.userId]: { error: updateError.message || "Password update failed." } }));
    }
  };

  return (
    <main className="management-page password-management-page">
      <header className="management-header">
        <h1>Password Management</h1>
        <BackButton fallback="/admin-dashboard" />
      </header>

      {!isVerified ? (
        <section className="password-verification-card">
          <div className="password-lock-mark" aria-hidden="true">A</div>
          <h2>Admin confirmation required</h2>
          <p>Re-enter the admin password to view or update user passwords.</p>
          <form className="password-verification-form" onSubmit={handleVerify}>
            <label htmlFor="admin-confirm-password">Admin password</label>
            <input
              id="admin-confirm-password"
              type="password"
              autoComplete="current-password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              required
            />
            {error && <p className="password-error" role="alert">{error}</p>}
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Checking..." : "Continue"}
            </button>
          </form>
        </section>
      ) : users.length === 0 ? (
        <p className="empty-state">No user accounts are registered yet.</p>
      ) : (
        <>
          <p className="password-page-intro">Passwords are masked until you choose to reveal them. Set a new password and confirm it before saving.</p>
          <div className="password-user-list">
            {users.map((user) => {
              const message = rowMessages[user.userId] || {};
              return (
                <article className="password-user-card" key={user.userId}>
                  <div className="password-user-heading">
                    <div>
                      <h2>{user.username}</h2>
                      <span className="user-id-badge">{user.userId}</span>
                    </div>
                    <span className="password-status">Admin verified</span>
                  </div>

                  <div className="password-current-row">
                    <label htmlFor={`current-${user.userId}`}>Current password</label>
                    <div className="password-input-row">
                      <input
                        id={`current-${user.userId}`}
                        type={visiblePasswords[user.userId] ? "text" : "password"}
                        value={user.password || ""}
                        readOnly
                        autoComplete="off"
                      />
                      <button type="button" className="password-reveal-button" onClick={() => togglePassword(user.userId)}>
                        {visiblePasswords[user.userId] ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <div className="password-change-grid">
                    <label>
                      New password
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={newPasswords[user.userId] || ""}
                        onChange={(event) => setNewPasswords((current) => ({ ...current, [user.userId]: event.target.value }))}
                      />
                    </label>
                    <label>
                      Confirm new password
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmPasswords[user.userId] || ""}
                        onChange={(event) => setConfirmPasswords((current) => ({ ...current, [user.userId]: event.target.value }))}
                      />
                    </label>
                  </div>

                  <div className="password-save-row">
                    <button type="button" onClick={() => handlePasswordChange(user)} disabled={message.loading}>
                      {message.loading ? "Saving..." : "Save new password"}
                    </button>
                    {message.error && <p className="password-error" role="alert">{message.error}</p>}
                    {message.success && <p className="password-success" role="status">{message.success}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

export default ManagePasswords;
