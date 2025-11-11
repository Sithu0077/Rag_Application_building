import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append("username", username);
    form.append("email", email);
    form.append("password", password);

    try {
      await axios.post("http://127.0.0.1:8000/register", form);
      alert("✅ Registration successful!");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      alert("❌ Registration failed!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <form onSubmit={handleRegister} className="bg-white/95 p-8 rounded-3xl shadow-2xl w-96">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Register for SBB</h2>
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 p-3 border rounded-lg text-gray-800"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded-lg text-gray-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 border rounded-lg text-gray-800"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold"
        >
          Register
        </button>
        <p className="text-center text-sm mt-4 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
