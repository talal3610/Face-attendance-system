import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  collectFaceDescriptors,
  findBestFaceMatch,
  getFaceDescriptor,
  getFaceQuality,
  loadFaceRecognitionModels,
} from "../utils/faceRecognition";
import { getFirebaseStatus, getUsers, markAttendance, startAttendanceForDate, stopAttendanceForDate } from "../utils/localStore";
import BackButton from "./BackButton";
import "./MarkAttendance.css";

const today = () => new Date().toISOString().slice(0, 10);

function MarkAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const previewIntervalRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const lastRecognitionAtRef = useRef(0);
  const markedUserIdsRef = useRef(new Set());
  const [users, setUsers] = useState([]);
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState("Loading face recognition models...");
  const [isStarting, setIsStarting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [confirmation, setConfirmation] = useState("");

  const registeredUsers = useMemo(
    () => users.filter((user) => Array.isArray(user.faceDescriptor) && user.faceDescriptor.length > 0),
    [users]
  );

  const drawFaceBox = (box, isReady = false) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video?.videoWidth || !video?.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!box) return;

    context.beginPath();
    context.rect(box.x, box.y, box.width, box.height);
    context.lineWidth = 5;
    context.strokeStyle = isReady ? "#18a957" : "#f3b23f";
    context.stroke();
  };

  useEffect(() => {
    let isActive = true;

    const startCamera = async () => {
      try {
        const savedUsers = await getUsers();
        if (!isActive) return;
        setUsers(savedUsers);

        await loadFaceRecognitionModels();
        if (!isActive) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: false,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("Camera ready. Start attendance for a date.");
      } catch (error) {
        console.error("Attendance camera failed:", error);
        if (isActive) {
          setStatus("Unable to start camera. Check camera permission and refresh.");
        }
      }
    };

    startCamera();

    return () => {
      isActive = false;
      if (previewIntervalRef.current) window.clearInterval(previewIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionStarted) return undefined;

    const previewAndRecognize = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      try {
        // 1. Perform a quick detection for the UI box
        const result = await getFaceDescriptor(video);
        const quality = getFaceQuality(result?.box, video);

        // 2. Always update the UI box to prevent it from getting "stuck"
        drawFaceBox(result?.box, quality.ready);

        // 3. Early return if the recognition process is already busy
        if (isRecognizingRef.current) return;

        // 4. If face is not in quality position, update status and return
        if (!quality.ready) {
          setStatus(result ? quality.message : "Position your face in the frame.");
          return;
        }

        // 5. Debounce recognition attempts (wait at least 3 seconds between marks)
        const now = Date.now();
        if (now - lastRecognitionAtRef.current < 3000) {
          return;
        }

        // 6. Start the intensive recognition and marking process
        isRecognizingRef.current = true;
        setStatus(quality.message);

        // Capture multiple samples for better accuracy
        const descriptor = await collectFaceDescriptors(video, 5, 100);
        if (!descriptor) {
          setStatus("Recognition failed. Keep steady and try again.");
          isRecognizingRef.current = false;
          return;
        }

        const match = findBestFaceMatch(descriptor, registeredUsers);
        setMatchResult(match);

        if (!match.matched) {
          const distance = match.distance ? match.distance.toFixed(3) : "n/a";
          setStatus(`Face not recognized (Distance: ${distance}).`);
          isRecognizingRef.current = false;
          return;
        }

        if (markedUserIdsRef.current.has(match.user.userId)) {
          setStatus(`${match.user.username} is already marked Present.`);
          isRecognizingRef.current = false;
          return;
        }

        // 7. Save to database
        setStatus(`Saving attendance for ${match.user.username}...`);
        try {
          const record = await markAttendance({
            userId: match.user.userId,
            username: match.user.username, // Pass username to save a DB lookup
            status: "Present",
            date,
            // capturedImage is removed to stop uploading photos
          });

          lastRecognitionAtRef.current = Date.now();
          markedUserIdsRef.current.add(record.userId);
          setConfirmation(`${record.username} marked Present.`);
          setStatus("Attendance saved. Next user can stand in front of the camera.");
        } catch (err) {
          console.error("markAttendance failed:", err);
          setStatus(`Failed to save: ${err?.message || "Check network"}`);
        } finally {
          isRecognizingRef.current = false;
        }
      } catch (error) {
        console.error("Attendance loop error:", error);
        isRecognizingRef.current = false;
      }
    };

    previewIntervalRef.current = window.setInterval(previewAndRecognize, 250);
    return () => {
      if (previewIntervalRef.current) window.clearInterval(previewIntervalRef.current);
    };
  }, [date, registeredUsers, sessionStarted]);

  const handleStartAttendance = async () => {
    setIsStarting(true);
    setConfirmation("");
    setMatchResult(null);
    markedUserIdsRef.current = new Set();

    try {
      const savedUsers = await getUsers();
      setUsers(savedUsers);

      if (savedUsers.length === 0) {
        setStatus("No users registered yet.");
        return;
      }

      const result = await startAttendanceForDate(date);
      setSessionStarted(true);
      setStatus(
        result.created
          ? `Attendance started for ${date}. All users are initially Absent.`
          : `Attendance for ${date} was already started. Continuing live recognition.`
      );
    } catch (error) {
      console.error("Unable to start attendance:", error);
      setStatus("Unable to start attendance. Check Firebase setup and try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopAttendance = async () => {
    setIsStarting(true);
    try {
      const result = await stopAttendanceForDate(date);
      if (result.stopped) {
        setSessionStarted(false);
        setStatus(`Attendance stopped for ${date}.`);
      } else {
        setStatus(`Unable to stop attendance for ${date}.`);
      }
    } catch (err) {
      console.error(err);
      setStatus("Unable to stop attendance. Try again.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <h1>Face Attendance</h1>
        <BackButton fallback="/admin-dashboard" />
      </header>

      {!getFirebaseStatus().isConfigured && (
        <p className="empty-state">
          Firebase is not configured yet. The app is using temporary browser storage until you add `.env`.
        </p>
      )}

      <div className="attendance-recognition-layout">
        <div className="attendance-video-panel">
          <video ref={videoRef} autoPlay muted playsInline className="attendance-video" />
          <canvas ref={canvasRef} className="attendance-canvas-overlay" />
        </div>

        <section className="recognition-panel">
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSessionStarted(false);
                setConfirmation("");
                markedUserIdsRef.current = new Set();
              }}
            />
          </label>

          {!sessionStarted ? (
            <button type="button" onClick={handleStartAttendance} disabled={isStarting || registeredUsers.length === 0}>
              {isStarting ? "Starting..." : "Start Attendance"}
            </button>
          ) : (
            <button type="button" onClick={handleStopAttendance} disabled={isStarting}>
              {isStarting ? "Stopping..." : "Stop Attendance"}
            </button>
          )}

          <p className="status-message">{status}</p>
          {confirmation && <p className="confirmation-message">{confirmation}</p>}

          {matchResult?.matched && (
            <div className="match-card">
              <strong>{matchResult.user.username}</strong>
              <span>User ID: {matchResult.user.userId}</span>
              <span>Distance: {matchResult.distance.toFixed(3)}</span>
            </div>
          )}

          {users.length === 0 && <p className="empty-state">No users registered yet.</p>}
          {users.length > 0 && registeredUsers.length === 0 && (
            <p className="empty-state">Registered users need face profiles before live attendance can start.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default MarkAttendance;
