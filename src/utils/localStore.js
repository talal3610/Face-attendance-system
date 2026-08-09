import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured, storage } from "./firebase";
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";

const USERS_KEY = "face_attendance_users";
const ATTENDANCE_KEY = "face_attendance_records";
const SESSION_KEY = "face_attendance_session";

const readJson = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key}`, error);
    return fallback;
  }
};

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const recordId = (date, userId) => `${date}_${userId}`;

const getLocalUsers = () => readJson(USERS_KEY, []);
const getLocalAttendanceRecords = () => readJson(ATTENDANCE_KEY, []);
const normalizeTimestamp = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return "";
};

const normalizeUser = (user) => ({
  ...user,
  createdAt: normalizeTimestamp(user.createdAt),
});

export const getUsers = async () => {
  if (!isFirebaseConfigured) return getLocalUsers();

  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs
    .map((userDoc) => normalizeUser(userDoc.data()))
    .sort((a, b) => (a.username || "").localeCompare(b.username || ""));
};

export const getUserById = async (userId) => {
  const cleanUserId = userId.trim().toLowerCase();
  if (!cleanUserId) return null;

  if (!isFirebaseConfigured) {
    return getLocalUsers().find((user) => user.userId.toLowerCase() === cleanUserId) || null;
  }

  const snapshot = await getDoc(doc(db, "users", cleanUserId));
  return snapshot.exists() ? normalizeUser(snapshot.data()) : null;
};
export const saveUser = async (user) => {
  const cleanUserId = user.userId.trim().toLowerCase();
  const nextUser = {
    ...user,
    userId: cleanUserId,
    faceDescriptor: Array.isArray(user.faceDescriptor) ? user.faceDescriptor : [],
    createdAt: new Date().toISOString(),
    capturedImage: null,
  };

  if (!isFirebaseConfigured) {
    const users = getLocalUsers();
    if (users.some((existingUser) => existingUser.userId.toLowerCase() === cleanUserId)) {
      throw new Error("A user with this ID already exists.");
    }

    const nextUsers = [...users, nextUser];
    writeJson(USERS_KEY, nextUsers);
    // ...

    // For local fallback, mark prior attendance dates as "N/A" for this new user
    try {
      const registrationDate = new Date().toISOString().slice(0, 10);
      const records = getLocalAttendanceRecords();
      const dates = Array.from(new Set(records.map((r) => r.date)));
      const newRecords = [];
      dates.forEach((d) => {
        if (d >= registrationDate) return;
        const exists = records.some((r) => r.userId === cleanUserId && r.date === d);
        if (!exists) {
          newRecords.push({
            id: recordId(d, cleanUserId),
            userId: cleanUserId,
            username: nextUser.username,
            status: "N/A",
            date: d,
            markedAt: new Date().toISOString(),
          });
        }
      });
      if (newRecords.length > 0) {
        writeJson(ATTENDANCE_KEY, [...records, ...newRecords]);
      }
    } catch (err) {
      // ignore
    }

    return nextUsers;
  }

  const userRef = doc(db, "users", cleanUserId);
  const existingUser = await getDoc(userRef);
  if (existingUser.exists()) {
    throw new Error("A user with this ID already exists.");
  }

  await setDoc(userRef, {
    ...nextUser,
    createdAt: serverTimestamp(),
  });
  // After creating the user, ensure past attendance sessions have an explicit record for this user marked as "N/A"
  try {
    const registrationDate = new Date().toISOString().slice(0, 10);
    const sessionsSnapshot = await getDocs(collection(db, "attendanceSessions"));
    await Promise.all(
      sessionsSnapshot.docs.map(async (sessionDoc) => {
        const sessionDate = sessionDoc.data()?.date;
        if (!sessionDate) return;
        if (sessionDate >= registrationDate) return; // only for dates before registration

        const recId = recordId(sessionDate, cleanUserId);
        const recRef = doc(db, "attendanceRecords", recId);
        const recSnap = await getDoc(recRef);
        if (!recSnap.exists()) {
          await setDoc(recRef, {
            id: recId,
            userId: cleanUserId,
            username: nextUser.username,
            status: "N/A",
            date: sessionDate,
            markedAt: serverTimestamp(),
          });
        }
      })
    );
  } catch (err) {
    // Non-fatal: log and continue
    // eslint-disable-next-line no-console
    console.error("Failed to write historical N/A attendance records:", err);
  }

  return getUsers();
};

export const deleteUser = async (userId) => {
  const cleanUserId = userId.trim().toLowerCase();
  if (!isFirebaseConfigured) {
    const nextUsers = getLocalUsers().filter((user) => user.userId !== cleanUserId);
    const nextAttendance = getLocalAttendanceRecords().filter((record) => record.userId !== cleanUserId);
    writeJson(USERS_KEY, nextUsers);
    writeJson(ATTENDANCE_KEY, nextAttendance);
    return nextUsers;
  }

  await deleteDoc(doc(db, "users", cleanUserId));
  const attendanceSnapshot = await getDocs(collection(db, "attendanceRecords"));
  await Promise.all(
    attendanceSnapshot.docs
      .filter((attendanceDoc) => (attendanceDoc.data().userId || "").toLowerCase() === cleanUserId)
      .map((attendanceDoc) => deleteDoc(attendanceDoc.ref))
  );
  return getUsers();
};

export const validateUser = async (userId, password) => {
  const user = await getUserById(userId);
  if (!user || user.password !== password) return null;
  return user;
};

export const setCurrentUser = (user) => {
  writeJson(SESSION_KEY, user ? { userId: user.userId, username: user.username } : null);
};

export const getCurrentUser = () => readJson(SESSION_KEY, null);

export const getAttendanceRecords = async () => {
  if (!isFirebaseConfigured) return getLocalAttendanceRecords();

  const snapshot = await getDocs(collection(db, "attendanceRecords"));
  return snapshot.docs.map((attendanceDoc) => attendanceDoc.data());
};

export const hasAttendanceSession = async (date) => {
  if (!isFirebaseConfigured) {
    return getLocalAttendanceRecords().some((record) => record.date === date);
  }

  const session = await getDoc(doc(db, "attendanceSessions", date));
  return session.exists();
};

export const startAttendanceForDate = async (date) => {
  const users = await getUsers();
  const startedAt = new Date().toISOString();

  if (!isFirebaseConfigured) {
    const records = getLocalAttendanceRecords();
    const existingDateRecords = records.filter((record) => record.date === date);
    if (existingDateRecords.length > 0) {
      return { created: false, records: existingDateRecords };
    }

    const absentRecords = users.map((user) => ({
      id: recordId(date, user.userId.toLowerCase()),
      userId: user.userId.toLowerCase(),
      username: user.username,
      status: "Absent",
      date,
      markedAt: startedAt,
    }));

    writeJson(ATTENDANCE_KEY, [...records, ...absentRecords]);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("attendance-updated", { detail: { date, created: true } }));
    }
    return { created: true, records: absentRecords };
  }

  const sessionRef = doc(db, "attendanceSessions", date);
  const session = await getDoc(sessionRef);
  if (session.exists()) {
    return { created: false, records: await getAttendanceRecords() };
  }

  await setDoc(sessionRef, {
    date,
    startedAt: serverTimestamp(),
  });

  const absentRecords = users.map((user) => ({
    id: recordId(date, user.userId.toLowerCase()),
    userId: user.userId.toLowerCase(),
    username: user.username,
    status: "Absent",
    date,
    markedAt: startedAt,
  }));

  await Promise.all(
    absentRecords.map((record) => setDoc(doc(db, "attendanceRecords", record.id), record))
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("attendance-updated", { detail: { date, created: true } }));
  }

  return { created: true, records: absentRecords };
};

export const stopAttendanceForDate = async (date) => {
  if (!isFirebaseConfigured) {
    // No-op for local fallback; session not tracked separately.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("attendance-updated", { detail: { date, stopped: true } }));
    }
    return { stopped: true };
  }

  try {
    const sessionRef = doc(db, "attendanceSessions", date);
    const session = await getDoc(sessionRef);
    if (!session.exists()) return { stopped: false };
    await setDoc(sessionRef, { ...session.data(), endedAt: serverTimestamp() }, { merge: true });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("attendance-updated", { detail: { date, stopped: true } }));
    }
    return { stopped: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to stop attendance for date:", err);
    return { stopped: false, error: err };
  }
};
export const markAttendance = async ({ userId, status, date, capturedImage = null, username = null }) => {
  const cleanUserId = userId.trim().toLowerCase();

  // Use provided username or fetch from DB if missing
  let finalUsername = username;
  if (!finalUsername) {
    const user = await getUserById(cleanUserId);
    if (!user) throw new Error("Selected user was not found.");
    finalUsername = user.username;
  }

  const record = {
    id: recordId(date, cleanUserId),
    userId: cleanUserId,
    username: finalUsername,
    status,
    date,
    markedAt: new Date().toISOString(),
    capturedImage: null,
  };

  if (!isFirebaseConfigured) {
    // ...

    const records = getLocalAttendanceRecords();
    const existingIndex = records.findIndex((item) => item.id === record.id);
    const nextRecords =
      existingIndex >= 0
        ? records.map((item, index) => (index === existingIndex ? { ...item, ...record } : item))
        : [...records, record];
    writeJson(ATTENDANCE_KEY, nextRecords);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("attendance-updated", { detail: record }));
    }
    return record;
  }

  // If there's a captured image (data URL), upload it to Firebase Storage and store the download URL instead.
  if (capturedImage && typeof capturedImage === "string" && capturedImage.startsWith("data:")) {
    try {
      const imageRef = storageRef(storage, `attendanceImages/${record.id}.jpg`);
      await uploadString(imageRef, capturedImage, "data_url");
      const url = await getDownloadURL(imageRef);
      record.capturedImage = url;
    } catch (err) {
      // Log and continue without image to avoid blocking attendance marking.
      // eslint-disable-next-line no-console
      console.error("Failed to upload attendance image:", err);
      record.capturedImage = null;
    }
  }

  await setDoc(doc(db, "attendanceRecords", record.id), record, { merge: true });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("attendance-updated", { detail: record }));
  }
  return record;
};

export const getFirebaseStatus = () => ({
  isConfigured: isFirebaseConfigured,
});
