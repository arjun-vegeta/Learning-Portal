// src/components/Message.js
import React from 'react';
import { FiX } from 'react-icons/fi';

const Message = ({ type, children, onClose }) => (
  <div className={`p-3 rounded-lg mb-4 text-sm relative ${
    type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
  }`}>
    {children}
    <button
      onClick={onClose}
      className="absolute top-3 right-2 text-gray-500 hover:text-gray-700"
    >
      <FiX className="h-5 w-5" />
    </button>
  </div>
);

export default Message;