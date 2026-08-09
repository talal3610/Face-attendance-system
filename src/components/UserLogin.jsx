import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { Link } from "react-router-dom";// Import useNavigate for navigation
import { setCurrentUser, validateUser } from "../utils/localStore";
import BackButton from "./BackButton";
import "./userlogin.css"; // Ensure the CSS is linked

function UserLogin() {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const user = await validateUser(userID, password);
      if (user) {
        setCurrentUser(user);
        alert("User login successful!");
        navigate("/user-dashboard"); 
      } else {
        alert("Invalid User ID or password. Please try again.");
      }
    } catch (error) {
      console.error("User login failed:", error);
      alert("Unable to login right now. Check Firebase setup and try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="user-login-container">
      <BackButton fallback="/" />
      <h1 className="user-login-title">User Login</h1>
      <input
        type="text"
        placeholder="User ID" // Change placeholder to "User ID"
        value={userID} // Bind to userID state
        onChange={(e) => setUserID(e.target.value)} // Update userID on input change
        className="user-login-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="user-login-input"
      />
      <button className="user-login-button" onClick={handleLogin} disabled={isLoggingIn}>
        {isLoggingIn ? "Logging in..." : "Login"}
      </button>
      {/* Optional Link to Admin Login */}
      <Link to="/admin" className="user-login-link">
        Login as Admin
      </Link>
    </div>
  );
}

export default UserLogin;
