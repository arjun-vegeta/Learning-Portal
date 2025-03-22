import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiUser, FiUserPlus, FiTrash2, FiBook, FiUsers, FiEdit } from 'react-icons/fi';

// Common Components
const Message = ({ type, children, onClose }) => (
  <div className={`p-3 rounded-lg mb-4 text-sm relative ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
    {children}
    <button
      onClick={onClose}
      className="absolute top-3 right-2 text-gray-500 hover:text-gray-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center mb-4">
    {icon}
    <h2 className="text-xl font-semibold ml-2">{title}</h2>
  </div>
);

const AdminDashboard = () => {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('teacher'); // for adding new user
  const [newUser, setNewUser] = useState({ username: '', name: '', password: '', courses: [''] });
  const token = localStorage.getItem('token');

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/admin/teachers', {
        headers: { authorization: token },
      });
      setTeachers(res.data.teachers);
    } catch (err) {
      setError('Failed to fetch teachers');
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/admin/students', {
        headers: { authorization: token },
      });
      setStudents(res.data.students);
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
  }, []);

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:5001/api/admin/user/${userId}`, {
        headers: { authorization: token },
      });
      setMessage('User deleted successfully');
      fetchTeachers();
      fetchStudents();
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newUser, role: userType };
      if (userType !== 'teacher') {
        delete payload.courses;
      }
      await axios.post('http://localhost:5001/api/admin/user', payload, {
        headers: { authorization: token },
      });
      setMessage('User added successfully');
      setNewUser({ username: '', name: '', password: '', courses: [''] });
      fetchTeachers();
      fetchStudents();
    } catch (err) {
      setError('Error adding user');
      console.error(err);
    }
  };

  const handleCourseChange = (index, value) => {
    const updatedCourses = [...newUser.courses];
    updatedCourses[index] = value;
    setNewUser({ ...newUser, courses: updatedCourses });
  };

  const addCourseField = () => {
    setNewUser({ ...newUser, courses: [...newUser.courses, ''] });
  };

  const clearMessage = () => {
    setMessage('');
  };

  const clearError = () => {
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <FiUser className="mr-2 text-blue-500" />
          Admin Dashboard
        </h1>

        {/* Messages */}
        {message && (
          <Message type="success" onClose={clearMessage}>
            {message}
          </Message>
        )}
        {error && (
          <Message type="error" onClose={clearError}>
            {error}
          </Message>
        )}

        {/* Add New User Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <SectionHeader icon={<FiUserPlus className="text-green-500" />} title="Add New User" />
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={userType === 'teacher'}
                  onChange={() => setUserType('teacher')}
                  className="mr-2"
                />
                Teacher
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={userType === 'student'}
                  onChange={() => setUserType('student')}
                  className="mr-2"
                />
                Student
              </label>
            </div>
            <input
              type="text"
              placeholder="Name"
              className="w-full p-2 border rounded-lg"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Username"
              className="w-full p-2 border rounded-lg"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 border rounded-lg"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            {userType === 'teacher' && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Courses they teach:</h3>
                {newUser.courses.map((course, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Course ${index + 1}`}
                    className="w-full p-2 border rounded-lg"
                    value={course}
                    onChange={(e) => handleCourseChange(index, e.target.value)}
                    required
                  />
                ))}
                <button
                  type="button"
                  onClick={addCourseField}
                  className="text-blue-500 hover:text-blue-700"
                >
                  + Add another course
                </button>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
            >
              Add User
            </button>
          </form>
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <SectionHeader icon={<FiBook className="text-purple-500" />} title="Teachers" />
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-left">Courses</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{teacher.id}</td>
                    <td className="py-3 px-4">{teacher.name}</td>
                    <td className="py-3 px-4">{teacher.username}</td>
                    <td className="py-3 px-4">{teacher.courses}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteUser(teacher.id)}
                        className="text-red-500 hover:text-red-700 flex items-center"
                      >
                        <FiTrash2 className="mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <SectionHeader icon={<FiUsers className="text-orange-500" />} title="Students" />
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-left">Courses</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">{student.id}</td>
                    <td className="py-3 px-4">{student.name}</td>
                    <td className="py-3 px-4">{student.username}</td>
                    <td className="py-3 px-4">{student.courses}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteUser(student.id)}
                        className="text-red-500 hover:text-red-700 flex items-center"
                      >
                        <FiTrash2 className="mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;