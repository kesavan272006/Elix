import { initializeApp } from "firebase/app";import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCy_J1lnvtTVF5EqE6rfrYIdF4ObaMw-N8",
  authDomain: "elix-796ef.firebaseapp.com",
  projectId: "elix-796ef",
  storageBucket: "elix-796ef.firebasestorage.app",
  messagingSenderId: "93479478191",
  appId: "1:93479478191:web:ed2bb2e18e5f894fb4c55a",
  measurementId: "G-K44M308HL2"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleprovider = new GoogleAuthProvider(app);
export const database = getFirestore(app);