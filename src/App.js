import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminLogin from "./components/Adminlogin";
import AdminDashboard from "./components/AdminDashboard"; // Admin Dashboard
import Dashboard from "./components/dashboard";
import UserLogin from "./components/UserLogin";
import UserDashboard from "./components/UserDashboard";
import RegisterPage from "./components/RegisterPage";
import UserInfoPage from "./components/UserInfoPage";
import ViewAttendance from "./components/ViewAttendance";
import MarkAttendance from "./components/MarkAttendance";
import DeleteUser from "./components/DeleteUser";
import ViewAllUsers from "./components/ViewAllUsers";
import BackButton from "./components/BackButton";
import RequireAuth from "./components/RequireAuth";
import "./components/AdminDashboard.css";

function SuccessPage() {
  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-back-row">
        <BackButton fallback="/admin-dashboard" />
      </div>
      <h1 className="admin-dashboard-title">User Registered Successfully</h1>
      <div className="admin-dashboard-button-container">
        <Link className="admin-dashboard-button" to="/admin-dashboard">
          Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/user" element={<UserLogin />} />
        <Route path="/register" element={<RequireAuth><RegisterPage /></RequireAuth>} />
        <Route path="/user-info" element={<RequireAuth><UserInfoPage /></RequireAuth>} />
        <Route path="/user-dashboard" element={<RequireAuth><UserDashboard /></RequireAuth>} />
        <Route path="/admin-dashboard" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="/view-attendance" element={<RequireAuth><ViewAttendance/></RequireAuth>} />
        <Route path="/markattendance" element={<RequireAuth><MarkAttendance/></RequireAuth>}/>
        <Route path="/deleteuser" element={<RequireAuth><DeleteUser/></RequireAuth>}/>
        <Route path="/viewallusers" element={<RequireAuth><ViewAllUsers/></RequireAuth>}/>
        <Route path="/success" element={<SuccessPage />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
