import React, { useEffect, useMemo, useState } from "react";
import { getAttendanceRecords, getCurrentUser, getUsers } from "../utils/localStore";
import BackButton from "./BackButton";
import "./ViewAttendance.css";
import "./MarkAttendance.css";

const sortDates = (dates) => [...dates].sort((a, b) => a.localeCompare(b));

function ViewAttendance() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadAttendance = async () => {
      try {
        const savedCurrentUser = getCurrentUser();
        const [savedUsers, savedRecords] = await Promise.all([getUsers(), getAttendanceRecords()]);

        if (!isActive) return;
        setUsers(savedUsers);
        setRecords(savedRecords);
        setCurrentUser(savedCurrentUser);
      } catch (error) {
        console.error("Unable to load attendance:", error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadAttendance();

    // Refresh when attendance changes elsewhere in the app
    const onUpdate = () => {
      loadAttendance();
    };
    window.addEventListener("attendance-updated", onUpdate);

    return () => {
      isActive = false;
      window.removeEventListener("attendance-updated", onUpdate);
    };
  }, []);

  const dates = useMemo(() => sortDates(new Set(records.map((record) => record.date))), [records]);

  const recordsByUserAndDate = useMemo(() => {
    return records.reduce((lookup, record) => {
      lookup[`${record.userId}_${record.date}`] = record;
      return lookup;
    }, {});
  }, [records]);

  const personalRecords = useMemo(() => {
    if (!currentUser) return [];
    return records
      .filter((record) => record.userId === currentUser.userId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, currentUser]);

  const attendancePercentage = useMemo(() => {
    if (!currentUser || personalRecords.length === 0) return 0;
    const applicableRecords = personalRecords.filter((record) => record.status !== "N/A");
    if (applicableRecords.length === 0) return 0;

    const presentCount = applicableRecords.filter((record) => record.status === "Present").length;
    return Math.round((presentCount / applicableRecords.length) * 100);
  }, [currentUser, personalRecords]);

  const isAdmin = currentUser && currentUser.userId === "admin";

  return (
    <main className="management-page attendance-page">
      <header className="management-header">
        <h1>View Attendance</h1>
        <BackButton fallback={isAdmin ? "/admin-dashboard" : "/user-dashboard"} />
      </header>

      {isLoading ? (
        <p className="empty-state">Loading attendance...</p>
      ) : isAdmin ? (
        // Admin view: matrix of users x dates
        dates.length === 0 ? (
          <p className="empty-state">No attendance dates found. Start attendance from the admin dashboard.</p>
        ) : (
          <div className="table-wrap attendance-matrix-wrap">
            <table className="attendance-matrix">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>User ID</th>
                  {dates.map((date) => (
                    <th key={date}>{date}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>{user.username}</td>
                    <td>{user.userId}</td>
                    {dates.map((date) => {
                      const record = recordsByUserAndDate[`${user.userId}_${date}`];
                      const status = record?.status || "Absent";
                      return (
                        <td key={date}>
                          <span className={`status-pill status-${status.toLowerCase()}`}>
                            {status}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : currentUser ? (
        // Regular user view: personal records and percentage
        <>
          <section className="attendance-percentage-card">
            <span>Attendance</span>
            <strong>{attendancePercentage}%</strong>
            <small>{currentUser.username}</small>
          </section>

          {personalRecords.length === 0 ? (
            <p className="empty-state">No attendance records found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {personalRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>
                        <span className={`status-pill status-${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="empty-state">No attendance data available.</p>
      )}
    </main>
  );
}

export default ViewAttendance;
