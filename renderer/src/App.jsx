import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/landing'
import SignIn from './pages/signIn'
import Home from './pages/home'

function App() {

  return (
    <Routes>
      <Route path='/' element={<Landing />} />
      <Route path='/signin' element={<SignIn />} />
      <Route path='/home' element={<Home />} />
    </Routes>
  )
}

export default App
