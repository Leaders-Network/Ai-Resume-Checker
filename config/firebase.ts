import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage"; // ✅


// Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyDTyqck8VKB2DX7Y6r_CXC3-HpR7zcHX1c",
  authDomain: "ai-resume-checker-3abb1.firebaseapp.com",
  projectId: "ai-resume-checker-ac609",
  storageBucket: "ai-resume-checker-ac609.appspot.com", // ✅ MUST be .appspot.com
  messagingSenderId: "1052080896087",
  appId: "1:1052080896087:web:21934f2c66f7028b6ccb12",
  measurementId: "G-DDBYMYNLCF",
  databaseURL: "https://ai-resume-checker-ac609-default-rtdb.firebaseio.com/", 
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app); // ✅
export const provider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

