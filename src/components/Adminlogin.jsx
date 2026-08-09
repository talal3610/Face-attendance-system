import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { setCurrentUser } from "../utils/localStore";
import BackButton from "./BackButton";
import "./Adminlogin.css"; // Ensure this CSS file is already linked for styling

function Adminlogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === "talal" && password === "0361") {
      // Store a simple admin session so logout and protected routes work
      setCurrentUser({ userId: "admin", username: "Admin" });
      alert("Admin login successful!");
      navigate("/admin-dashboard"); // Redirect to admin dashboard
    } else {
      alert("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="admin-login-container">
      <BackButton fallback="/" />
      <h1 className="admin-login-title">Admin Login</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="admin-login-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="admin-login-input"
      />
      <button className="admin-login-button" onClick={handleLogin}>
        Login
      </button>
      {/* Add Link below */}
      <Link to="/user" className="admin-login-link">
        Login as User
      </Link>
    </div>
  );
}

export default Adminlogin;
