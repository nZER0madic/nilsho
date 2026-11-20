import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAvSzHh4rCW8U4Ww3kR36YASrB2OQzeFEw",
  authDomain: "maschlernen.firebaseapp.com",
  databaseURL: "https://maschlernen-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "maschlernen",
  storageBucket: "maschlernen.firebasestorage.app",
  messagingSenderId: "429948931509",
  appId: "1:429948931509:web:d06915585e792921ddddfc",
};

// Verhindert, dass die App bei Hot Reload mehrfach initialisiert wird
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
