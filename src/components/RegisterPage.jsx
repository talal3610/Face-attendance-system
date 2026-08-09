import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collectFaceDescriptors,
  getFaceDescriptor,
  getFaceQuality,
  loadFaceRecognitionModels,
} from "../utils/faceRecognition";
import BackButton from "./BackButton";
import "./RegisterPage.css";

function RegisterPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const isCapturingRef = useRef(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Loading face recognition models...");
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const drawFaceBox = (box, isReady = false) => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (!box) return;

      context.beginPath();
      context.rect(box.x, box.y, box.width, box.height);
      context.lineWidth = 4;
      context.strokeStyle = isReady ? "#1d9a5b" : "#f3b23f";
      context.stroke();
    };

    const previewFace = async () => {
      if (!isActive || !videoRef.current || isCapturingRef.current) return;
      if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      const result = await getFaceDescriptor(videoRef.current);
      if (!isActive) return;

      const quality = getFaceQuality(result?.box, videoRef.current);
      drawFaceBox(result?.box, quality.ready);
      setIsReady(quality.ready);
      setStatus(result ? quality.message : "No face detected.");
    };

    const startWebcam = async () => {
      try {
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
        setStatus("Camera ready. Position one face in the frame.");
        intervalRef.current = window.setInterval(previewFace, 400);
      } catch (err) {
        console.error("Registration camera failed:", err);
        if (isActive) {
          setError("Unable to start face recognition. Check camera permission and refresh.");
          setStatus("");
        }
      }
    };

    startWebcam();

    return () => {
      isActive = false;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;

    setError(null);
    isCapturingRef.current = true;
    setIsCapturing(true);
    setStatus("Capturing multiple face samples...");

    try {
      const descriptor = await collectFaceDescriptors(videoRef.current, 10, 50);
      const image = captureImage();

      if (!descriptor || !image) {
        setError("Could not capture a clear face. Keep one face centered and try again.");
        return;
      }

      setFaceDescriptor(descriptor);
      setCapturedImage(image);
      setStatus("Face profile captured. Continue to user details.");
    } catch (err) {
      console.error("Face capture failed:", err);
      setError("Face capture failed. Make sure lighting is clear and try again.");
    } finally {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }
  };

  const handleRegister = () => {
    if (!faceDescriptor || !capturedImage) {
      setError("Capture the user's face before continuing.");
      return;
    }

    navigate("/user-info", {
      state: {
        faceDescriptor,
        capturedImage,
      },
    });
  };

  return (
    <div className="register-container">
      <div className="register-back-row">
        <BackButton fallback="/admin-dashboard" />
      </div>
      {error && <p className="error-message">{error}</p>}
      {status && <p className="status-message">{status}</p>}
      <div className="video-container">
        <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
        <canvas ref={canvasRef} className="canvas-overlay" />
      </div>
      <div className="register-button-container">
        <button type="button" onClick={handleCapture} disabled={isCapturing || !isReady}>
          {isCapturing ? "Capturing..." : "Capture Face"}
        </button>
        <button type="button" onClick={handleRegister} disabled={!faceDescriptor}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;
