import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import {  initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // ✅


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChSxls4C1TrSzPVjTRySEiVe3U-jjJrSM",
  authDomain: "ai-resume-checker-453da.firebaseapp.com",
  databaseURL: "https://ai-resume-checker-453da-default-rtdb.firebaseio.com",
  projectId: "ai-resume-checker-453da",
  storageBucket: "ai-resume-checker-453da.appspot.com",
  messagingSenderId: "1089704000703",
  appId: "1:1089704000703:web:ecda1f06565b764bfe1a0a",
  measurementId: "G-L292LR922B"
};

const app = initializeApp(firebaseConfig);

// Create and export the configured Firestore instance
const configuredDb = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export const db = configuredDb;
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app); // ✅
export const provider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

