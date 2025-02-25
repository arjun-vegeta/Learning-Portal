// App.js
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Navbar from './components/Navbar';

function App() {
  // Track auth status using state
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const role = localStorage.getItem('role');

  return (
    <div className="min-h-screen bg-gray-100">
      {authToken && <Navbar setAuthToken={setAuthToken} />}
      <Routes>
        <Route path="/login" element={<Login setAuthToken={setAuthToken} />} />
        <Route path="/register" element={<Register />} />
        {authToken && role === 'teacher' && (
          <Route path="/dashboard" element={<TeacherDashboard />} />
        )}
        {authToken && role === 'student' && (
          <Route path="/dashboard" element={<StudentDashboard />} />
        )}
        {authToken && role === 'admin' && (
          <Route path="/dashboard" element={<AdminDashboard />} />
        )}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
