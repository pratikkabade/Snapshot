import { collection, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDw2Om4P0yxOrnvLH-OoQrent3gLxivocE",
  authDomain: "the-web-sandbox.firebaseapp.com",
  projectId: "the-web-sandbox",
  storageBucket: "the-web-sandbox.appspot.com",
  messagingSenderId: "443328901544",
  appId: "1:443328901544:web:8e495628d2fbb263df2d9d",
  measurementId: "G-98K13DCQEQ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const provider = new GoogleAuthProvider();

export const db = getFirestore(app)
export const tasksCollectionRef = collection(db, "tasks")