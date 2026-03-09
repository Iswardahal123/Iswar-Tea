// 🔥 Firebase Config
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEYwsMN218xBBsHeStYBYJvOr2gqJEgTU",
  authDomain: "iswar-tea.firebaseapp.com",
  databaseURL: "https://iswar-tea-default-rtdb.firebaseio.com",
  projectId: "iswar-tea",
  storageBucket: "iswar-tea.firebasestorage.app",
  messagingSenderId: "858739038921",
  appId: "1:858739038921:web:787705827d542324a68b18",
  measurementId: "G-8GRLB8VRGF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
