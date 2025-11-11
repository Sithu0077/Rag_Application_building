import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Check token validity
    if (token && token !== "undefined" && token !== "null" && token.trim() !== "") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Show loading while checking auth
  if (isAuthenticated === null)
    return (
      <div className="flex items-center justify-center h-screen text-white text-lg">
        Checking authentication...
      </div>
    );

  // If not logged in, redirect to login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If logged in, show protected content
  return children;
}
