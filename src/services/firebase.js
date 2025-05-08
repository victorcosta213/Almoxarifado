import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCRbnOwINuocap4AxFiNSGVf3e3EOiPYBY",
  authDomain: "produtos-d89c6.firebaseapp.com",
  projectId: "produtos-d89c6",
  storageBucket: "produtos-d89c6.firebasestorage.app",
  messagingSenderId: "864292292943",
  appId: "1:864292292943:web:0e36d38502c292f4661d3a",
  measurementId: "G-5LYELW8ZRX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
