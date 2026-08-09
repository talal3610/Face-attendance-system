import React from "react";
import { Link } from "react-router-dom";
import "./dashboard.css"; // Import the external CSS file

function dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1 className="dashboard-title">Welcome to Our Web App</h1>
        <p className="dashboard-description">
          Please select your role to proceed. You can log in as an admin or as a user.
        </p>
        <div className="dashboard-button-container">
          <Link to="/admin">
            <button
              className="dashboard-button"
              onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
            >
              Login as Admin
            </button>
          </Link>
          <Link to="/user">
            <button
              className="dashboard-button"
              onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#007bff")}
            >
              Login as User
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default dashboard;
