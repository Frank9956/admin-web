// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// If you're using environment variables in Node.js (e.g. during SSR or CLI scripts)
import dotenv from 'dotenv';
dotenv.config(); // Load .env.local

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "habit-us-c24d0.firebaseapp.com",
  projectId: "habit-us-c24d0",
  storageBucket: "habit-us-c24d0.appspot.com",
  messagingSenderId: "649335907238",
  appId: "1:649335907238:web:20e2bccab87a74d1d2e567",
  measurementId: "G-SB3D7MKJ0K"
};

// Prevent re-initialization during hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
