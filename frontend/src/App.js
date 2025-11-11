import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Upload from "./Upload";
import Chat from "./chat";
import Login from "./auth/Login";
import Register from "./auth/Register";
import ProtectedRoute from "./auth/ProtectedRoute";

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-gray-800">
        <Routes>
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

// -----------------------------
// Dashboard Component (Main Page)
// -----------------------------
function Dashboard({ uploadedFiles, setUploadedFiles }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="relative container mx-auto p-6">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold"
      >
        Logout
      </button>

      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg">🧠 SBB</h1>
        <p className="text-white/80 mt-2">Chat with Your Documents Using AI</p>
      </header>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-white/95 rounded-2xl shadow-xl p-6 border border-white/30">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">📤 Upload Your Files</h2>
          <Upload uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
        </div>

        {/* Chat Section */}
        <div className="bg-white/95 rounded-2xl shadow-xl p-6 border border-white/30">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">💬 Ask Questions</h2>
          <Chat uploadedFiles={uploadedFiles} />
        </div>
      </div>
    </div>
  );
}
