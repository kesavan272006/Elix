import React, { useEffect, useState } from 'react'
import googlepic from '../assets/Googlepic.png';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth, database, googleprovider } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import './signin.css';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/home");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const signInWithGoogle = async () => {
    if (!username) {
      alert("Please enter username");
      return;
    }
    try {
      auth.signOut(); 
      const result = await signInWithPopup(auth, googleprovider);
      await addUser(result.user);
      navigate("/home");
    } catch (error) {
      console.error("Error:", error);
      alert(`Sign-in failed: ${error.message}`);
    }
  };

  const addUser = async () => {
    const userRef = collection(database, "Users");
    const userDocRef = doc(userRef, auth.currentUser.uid);

    try {
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          username: username,
          email: auth.currentUser.email,
        });
      }
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-background"></div>
      <div className="signin-form">
        <h1 className="signin-title">Welcome to ELIX</h1>
        <div className="input-group">
          <label className="input-label">Username</label>
          <input 
            type="text" 
            className="input-field"
            placeholder="Enter your username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <button 
          className="google-button" 
          onClick={signInWithGoogle}
        >
          <img src={googlepic} alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

export default SignIn
