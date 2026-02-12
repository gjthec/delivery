import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCID7AGwR-tfNsiJIBd0nPfBGE5adLAbwY",
  authDomain: "train-api-49052.firebaseapp.com",
  projectId: "train-api-49052",
  storageBucket: "train-api-49052.firebasestorage.app",
  messagingSenderId: "1056584302761",
  appId: "1:1056584302761:web:659d6c4a3692ded2c4a9b8",
  measurementId: "G-DT7ZYWWZ8E",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
