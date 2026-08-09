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
      <div className="admin-dashboard-button-container">
        <Link to="/register" className="admin-dashboard-button">
          Register User
        </Link>
        <Link to="/markattendance" className="admin-dashboard-button">
          Mark Attendance
        </Link>
        <Link to="/deleteuser" className="admin-dashboard-button">
          Delete User
        </Link>
        <Link to="/viewallusers" className="admin-dashboard-button">
          View All Users
        </Link>
        <Link to="/view-attendance" className="admin-dashboard-button">
          View Attendance
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
