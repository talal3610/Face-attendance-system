import React from "react";
import { Link } from "react-router-dom";
import "./dashboard.css"; // Import the external CSS file

function dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <p className="dashboard-eyebrow">Face attendance system</p>
        <h1 className="dashboard-title">Attendance, made simple.</h1>
        <p className="dashboard-description">
          Manage attendance and check your records in one place. Choose your sign-in to continue.
        </p>
        <div className="dashboard-button-container">
          <Link to="/admin" className="dashboard-button">
            <span className="dashboard-role-mark" aria-hidden="true">A</span>
            <span className="dashboard-role-copy"><strong>Admin sign in</strong><small>Manage users and sessions</small></span>
            <span className="dashboard-role-arrow" aria-hidden="true">→</span>
          </Link>
          <Link to="/user" className="dashboard-button">
            <span className="dashboard-role-mark" aria-hidden="true">U</span>
            <span className="dashboard-role-copy"><strong>User sign in</strong><small>Check your attendance</small></span>
            <span className="dashboard-role-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default dashboard;
