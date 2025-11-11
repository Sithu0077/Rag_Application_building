import React, { useState } from "react";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);

      // ✅ Send FormData to FastAPI
      const response = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.msg) {
        alert("✅ " + data.msg + " Please login to continue.");
        window.location.href = "/login";
      } else {
        let errorMessage = "⚠️ Registration failed. ";

        if (data.detail) {
          // Handles string or array error formats
          if (typeof data.detail === "string") {
            errorMessage += data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage += data.detail
              .map((d) => d.msg || JSON.stringify(d))
              .join(", ");
          } else {
            errorMessage += JSON.stringify(data.detail);
          }
        } else {
          errorMessage += JSON.stringify(data);
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("⚠️ Could not connect to backend. Please ensure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/40">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
          Create Your Account 🔐
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Register below to start chatting with your documents.
        </p>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 hover:shadow-xl"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-purple-600 font-semibold hover:underline"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
