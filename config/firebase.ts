import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // ✅

const firebaseConfig = {
  apiKey: "AIzaSyDNJygE_PYTwdA6ijOCFfowR6Japf2Z-WY",
  authDomain: "ai-resume-checker-74c1a.firebaseapp.com",
  projectId: "ai-resume-checker-74c1a",
  storageBucket: "ai-resume-checker-74c1a.appspot.com", // ✅ MUST be .appspot.com
  messagingSenderId: "23063429760",
  appId: "1:23063429760:web:09aa18a9cbc8757a551c65",
  measurementId: "G-ZJQH54PNQJ",
  databaseURL: "https://ai-resume-checker-74c1a-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app); // ✅

export const provider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

