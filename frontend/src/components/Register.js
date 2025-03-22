import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiBook, FiPlusCircle, FiLogIn } from 'react-icons/fi';
import Message from './Message';

const Register = () => {
  const [isTeacher, setIsTeacher] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [courses, setCourses] = useState(['']);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleCourseChange = (index, value) => {
    const newCourses = [...courses];
    newCourses[index] = value;
    setCourses(newCourses);
  };

  const addCourseField = () => {
    setCourses([...courses, '']);
  };

const handleRegister = async (e) => {
  e.preventDefault();
  const payload = {
    username,
    name,
    password,
    role: isTeacher ? 'teacher' : 'student'
  };
  if (isTeacher) {
    payload.courses = courses.filter(course => course.trim() !== '');
  }
  try {
    await axios.post('http://localhost:5001/api/auth/register', payload);
    navigate('/login', {
      state: { 
        successMessage: 'Account created successfully! Please login.' 
      }
    });
  } catch (err) {
    setError(err.response?.data?.error || 'Registration failed');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-700 to-blue-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
            <FiUser className="mr-2 text-blue-500" />
            Create Account
          </h1>
          <p className="text-gray-600">Join our learning community</p>
        </div>

        {error && <Message type="error" onClose={() => setError('')}>{error}</Message>}
        {successMessage && <Message type="success" onClose={() => setSuccessMessage('')}>{successMessage}</Message>}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="flex gap-4 justify-center mb-6">
            <button
              type="button"
              onClick={() => setIsTeacher(false)}
              className={`px-6 py-2 rounded-full ${
                !isTeacher 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setIsTeacher(true)}
              className={`px-6 py-2 rounded-full ${
                isTeacher 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Teacher
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute top-4 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Your name"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <FiUser className="absolute top-4 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Choose username"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute top-4 left-3 text-gray-400" />
              <input
                type="password"
                placeholder="Create password"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isTeacher && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                Courses you teach
              </h3>
              {courses.map((course, index) => (
                <div key={index} className="relative">
                  <FiBook className="absolute top-4 left-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Course ${index + 1}`}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={course}
                    onChange={(e) => handleCourseChange(index, e.target.value)}
                    required
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addCourseField}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <FiPlusCircle className="mr-2" />
                Add Course
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Account
          </button>

          <p className="text-center text-gray-600 mt-6">
            Already registered?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;