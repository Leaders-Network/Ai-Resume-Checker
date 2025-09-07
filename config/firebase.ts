import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import {  initializeFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // ✅


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYU5QtVd3IrpaY7fwHtaFtHCrHHOnIeCg",
  authDomain: "ai-resume-checker-42e9c.firebaseapp.com",
  databaseURL: "https://ai-resume-checker-42e9c-default-rtdb.firebaseio.com",
  projectId: "ai-resume-checker-42e9c",
  storageBucket: "ai-resume-checker-42e9c.appspot.com",
  messagingSenderId: "602601909832",
  appId: "1:602601909832:web:edc0c9d1b4b542e384f27d",
  measurementId: "G-KWFZ1GG2R6"
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

