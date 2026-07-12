import { useContext, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css'

const ProtectedRoute = ({ children }) => {
  const { user } = useContext( AuthContext );
  return user ? children : <Navigate to="/login" replace />
};

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />}/>
      <Route path="/register" element={<Register />}/>
    
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
       />

       <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
