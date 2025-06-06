import React from 'react'
import { useNavigate } from 'react-router-dom'
const Landing = () => {
    const navigate = useNavigate();
  return (
    <div>
        <h1>Welcome to Elix- Executive Learning Interface eXpert</h1>
        <button onClick={()=>navigate('/signin')}>Get started</button>
    </div>
  )
}

export default Landing