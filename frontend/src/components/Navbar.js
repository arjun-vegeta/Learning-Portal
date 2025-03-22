// Navbar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiLogOut } from 'react-icons/fi';

const Navbar = ({ setAuthToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    setAuthToken(null);
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-400 to-indigo-700 shadow-sm px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <FiBook className="text-2xl text-black mr-2" />
        <span className="text-xl font-bold text-black">E-Learning Portal</span>
      </div>
      
      <button
        onClick={handleLogout}
        className="flex items-center px-4 py-2 text-red-500 bg-white rounded-lg hover:bg-red-100 transition-colors"
      >
        <FiLogOut className="mr-2" />
        Logout
      </button>
    </nav>
  );
};

export default Navbar;