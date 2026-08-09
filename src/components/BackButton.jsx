import React from "react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";
import { setCurrentUser, getCurrentUser } from "../utils/localStore";

function BackButton({ fallback = "/", label = "Back", showLogout = false }) {
  const navigate = useNavigate();

  const handleBack = () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        if (currentUser.userId === "admin") {
          navigate("/admin-dashboard");
          return;
        }
        navigate("/user-dashboard");
        return;
      }

      // No signed-in user: fallback to provided fallback path
      navigate(fallback);
    } catch (err) {
      navigate(fallback);
    }
  };

  const handleLogout = () => {
    try {
      setCurrentUser(null);
    } catch (err) {
      // ignore
    }
    navigate("/");
  };

  const isSignedIn = Boolean(getCurrentUser());

  return (
    <div className="back-button-row">
      <button type="button" className="back-button" onClick={handleBack}>
        {label}
      </button>
      {isSignedIn && showLogout && (
        <button type="button" className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      )}
    </div>
  );
}

export default BackButton;
