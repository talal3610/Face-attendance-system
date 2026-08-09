import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveUser } from "../utils/localStore";
import BackButton from "./BackButton";
import "./UserInfoPage.css";

function UserInfoPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve the data passed from RegisterPage
  const { faceDescriptor, capturedImage } = location.state || {};

  // Debugging: log the received state
  useEffect(() => {
    if (!faceDescriptor || !capturedImage) {
      setError("Please capture a face before entering user details.");
    }
  }, [faceDescriptor, capturedImage]);

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleRegister = async () => {
    if (!username || !userId || !password) {
      setError("All fields are required.");
      return;
    }

    if (!faceDescriptor || !capturedImage) {
      setError("Face data is missing. Please go back and capture the user's face again.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await saveUser({
        username: username.trim(),
        userId: userId.trim(),
        password,
        faceDescriptor,
      });
      navigate("/success"); // Navigate to success page or dashboard
    } catch (err) {
      setError("Error registering user: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="user-info-container">
      <div className="user-info-back-row">
        <BackButton fallback="/register" />
      </div>
      {/* Display error message if any */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Conditionally display the captured image */}
      {capturedImage && (
        <div className="image-preview">
          <img src={capturedImage} alt="Captured Face" />
        </div>
      )}

      {/* Form to enter username, user ID, and password */}
      <div className="user-info-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleRegister} disabled={isSaving}>
          {isSaving ? "Registering..." : "Register"}
        </button>
        {isSaving && <div className="progress-bar">Registering user — please wait...</div>}
      </div>
    </div>
  );
}

export default UserInfoPage;
