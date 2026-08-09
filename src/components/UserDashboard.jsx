import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link for routing
import BackButton from "./BackButton";
import { setCurrentUser } from "../utils/localStore";
import "./UserDashboard.css"; // Import your custom CSS file

function UserDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <div className="user-dashboard-container">
      <div className="dashboard-top-row">
        <div className="dashboard-back-row">
          <BackButton fallback="/user" />
        </div>
        <div className="dashboard-logout-row">
          <button className="user-logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <h1 className="user-dashboard-title">User Dashboard</h1>
      <div className="user-dashboard-button-container">
        {/* Link to the attendance page (if needed) */}
        <Link to="/view-attendance" className="user-dashboard-button">
          View Attendance
        </Link>
      </div>
    </div>
  );
}

export default UserDashboard;
