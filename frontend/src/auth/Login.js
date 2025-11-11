import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append("username", email); // FastAPI expects 'username'
    form.append("password", password);

    try {
      const res = await axios.post("http://127.0.0.1:8000/login", form);
      const token = res.data.access_token;
      if (token) {
        localStorage.setItem("token", token);
        alert("✅ Login successful!");
        navigate("/");
      } else {
        alert("❌ No token received, check backend.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("❌ Invalid credentials!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <form onSubmit={handleLogin} className="bg-white/95 p-8 rounded-3xl shadow-2xl w-96">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Login to SBB</h2>
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
          Login
        </button>
        <p className="text-center text-sm mt-4 text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-purple-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
