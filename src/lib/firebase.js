// lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// 🔐 Replace these with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDbeBLPtqgLz7xqMPD57-rp2Dy40Ypj5QU",
    authDomain: "habit-us-c24d0.firebaseapp.com",
    projectId: "habit-us-c24d0",
    storageBucket: "habit-us-c24d0.firebasestorage.app",
    messagingSenderId: "649335907238",
    appId: "1:649335907238:web:20e2bccab87a74d1d2e567",
    measurementId: "G-SB3D7MKJ0K"
}

const app = initializeApp(firebaseConfig)

const db = getFirestore(app)
const storage = getStorage(app)

export { db, storage }


