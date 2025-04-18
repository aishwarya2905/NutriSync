import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWHSBO_x-4fCCoi01u0PSwNjojiUra9jk",
  authDomain: "nutrisynk-ai.firebaseapp.com",
  projectId: "nutrisynk-ai",
  storageBucket: "nutrisynk-ai.appspot.com",
  messagingSenderId: "696989980961",
  appId: "1:696989980961:web:ca777379f795dc71138660",
  measurementId: "G-G30M9NYB8D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth , db };