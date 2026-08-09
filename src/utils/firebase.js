// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPAEBUW26nxM1Sq4Zy1MIslpxoDiNNueU",
  authDomain: "faceattendance-2401f.firebaseapp.com",
  projectId: "faceattendance-2401f",
  storageBucket: "faceattendance-2401f.firebasestorage.app",
  messagingSenderId: "471437651038",
  appId: "1:471437651038:web:10af1e77c9f27f0ff3d8cf"
};

// Initialize Firebase
let app = null;
let db = null;
let isFirebaseConfigured = false;
let storage = null;
let auth = null;
let isAuthSignedIn = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    // Attempt anonymous sign-in to satisfy auth-based Firestore rules in development
    signInAnonymously(auth).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("Anonymous sign-in failed:", err);
    });

    onAuthStateChanged(auth, (user) => {
      isAuthSignedIn = !!user;
    });
    isFirebaseConfigured = true;
} catch (error) {
  // If initialization fails, leave exports as null/false and log the error.
  // Components using `isFirebaseConfigured` must handle the fallback.
  // Avoid throwing here to prevent breaking the app at import time.
  // eslint-disable-next-line no-console
  console.error("Firebase initialization failed:", error);
}

export { db, isFirebaseConfigured, storage, auth, isAuthSignedIn };