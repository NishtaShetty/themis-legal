import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-black text-white p-4 shadow-md flex justify-between">
      <div className="font-bold text-xl">NyayBot</div>
      <div className="space-x-4">
        <Link to="/">Info</Link>
        <Link to="/chat">Chatbot</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}