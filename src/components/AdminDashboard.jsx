import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link for routing
import BackButton from "./BackButton";
import { setCurrentUser } from "../utils/localStore";
import "./AdminDashboard.css"; // Import your custom CSS

function LogoutButton() {
  const navigate = useNavigate();
  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <button className="admin-logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
}

function AdminDashboard() {
  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-top-row">
        <div className="dashboard-back-row">
          <BackButton fallback="/" />
        </div>
        <div className="dashboard-logout-row">
          <LogoutButton />
        </div>
      </div>
      <h1 className="admin-dashboard-title">Admin Dashboard</h1>
      <p className="dashboard-intro">Manage your people and keep daily attendance organized from one place.</p>
      <div className="admin-dashboard-button-container">
        <Link to="/register" className="admin-dashboard-button">
          <span className="dashboard-action-copy">
            <strong className="dashboard-action-title">Register User</strong>
            <span className="dashboard-action-description">Create an account and capture a face profile.</span>
          </span>
        </Link>
        <Link to="/markattendance" className="admin-dashboard-button">
          <span className="dashboard-action-copy">
            <strong className="dashboard-action-title">Mark Attendance</strong>
            <span className="dashboard-action-description">Start a session and recognize attendees.</span>
          </span>
        </Link>
        <Link to="/deleteuser" className="admin-dashboard-button">
          <span className="dashboard-action-copy">
            <strong className="dashboard-action-title">Delete User</strong>
            <span className="dashboard-action-description">Remove an account and its records.</span>
          </span>
        </Link>
        <Link to="/viewallusers" className="admin-dashboard-button">
          <span className="dashboard-action-copy">
            <strong className="dashboard-action-title">View All Users</strong>
            <span className="dashboard-action-description">Browse registered profiles and account details.</span>
          </span>
        </Link>
        <Link to="/manage-passwords" className="admin-dashboard-button">
          <span className="dashboard-action-copy">
            <strong className="dashboard-action-title">Manage Passwords</strong>
            <span className="dashboard-action-description">View or update a user password after admin confirmation.</span>
          </span>
        </Link>
        <Link to="/view-attendance" className="admin-dashboard-button">
          <span className="dashboard-action-copy">
            <strong className="dashboard-action-title">View Attendance</strong>
            <span className="dashboard-action-description">Review attendance across users and dates.</span>
          </span>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
