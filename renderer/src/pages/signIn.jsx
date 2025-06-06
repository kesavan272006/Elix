import React, { useEffect, useState } from 'react'
import googlepic from '../assets/Googlepic.png';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth, database, googleprovider } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
const SignIn = () => {
  const [username, setUsername]= useState('');
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
            alert("Please enter username and select a role.");
            return;
        }
        try {
            await signInWithPopup(auth, googleprovider);
            addUser();
            navigate("/home");
        } catch (error) {
            console.error("Error signing in with Google:", error.message);
            alert("Error signing in with Google. Please try again.");
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
    <div>
        <label>Username: </label>
        <input type="text" placeholder='username' value={username} onChange={(e)=>setUsername(e.target.value)}/>
        <div className="buttons flex flex-col justify-center items-center mx-auto mt-10 codepen-button before:-z-10  md:w-3/4 rounded-full">
            <button className='text-white bg-black russo w-full rounded-full py-1 text-l md:w-full flex justify-center items-center gap-2 hover:scale-105 transition-all' onClick={signInWithGoogle}><img className='w-10' src={googlepic} /> Sign in with Google</button>
        </div>
    </div>
  )
}

export default SignIn
