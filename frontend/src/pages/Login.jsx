import React, { useState, useEffect } from "react";
import apiClient from "../services/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");  // Initialize with empty string
  const [password, setPassword] = useState("");  // Initialize with empty string
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Try to reach the backend
        const res = await apiClient.get("/test");
        console.log("✅ Backend check response:", res.data);
        
        if (res.data.message === "API is working") {
          setBackendStatus("connected");
          // Also check diagnostic
          try {
            const diag = await apiClient.get("/diagnostic");
            if (diag.data.userCount === 0) {
              setError("⚠️ Database not seeded. Please run 'npm run seed' in the backend folder.");
            }
          } catch (e) {
            console.log("Could not check diagnostic:", e);
          }
        }
      } catch (err) {
        console.error("❌ Backend check failed:", err);
        console.error("Error details:", {
          message: err.message,
          code: err.code,
          status: err.response?.status,
          url: err.config?.url
        });
        setBackendStatus("disconnected");
        setError("❌ Backend server is not running. Please start it with 'npm run dev' in the backend folder.");
      }
    };
    checkBackend();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (backendStatus === "disconnected") {
      setError("❌ Backend server is not running. Please start it first.");
      return;
    }
    
    setLoading(true);
    console.log("🔐 Attempting login with:", { email, password: "***" });
    
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      console.log("✅ Login successful:", res.data);
      login(res.data);
      const role = res.data.user.role;
      if (role === "super_admin") navigate("/superadmin");
      else if (role === "admin") navigate("/admin");
      else if (role === "attendant") navigate("/attendant");
      else navigate("/user");
    } catch (err) {
      console.error("❌ Login error:", err);
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        code: err.code
      });
      
      if (err.code === "ECONNREFUSED" || err.message.includes("Network Error")) {
        setError("❌ Cannot connect to server. Make sure the backend is running on port 5000.");
        setBackendStatus("disconnected");
      } else if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.message || "Invalid email or password";
        setError(`❌ ${errorMsg}\n\n💡 Try:\n- user1@example.com / user123\n- admin@example.com / admin123\n\nOr run 'npm run seed' in backend to reset users`);
      } else if (err.response?.status === 500) {
        setError("❌ Server error. Check backend console for details.");
      } else if (err.response?.data?.message) {
        setError(`❌ ${err.response.data.message}`);
      } else {
        setError("❌ Login failed. Check backend console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 pt-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-400">
          Sign in to manage and monitor the smart parking lot.
        </p>
      </div>

  

      <form
        onSubmit={handleSubmit}
        className="card flex flex-col gap-4 p-6"
      >
        

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-primary-500/40 focus:border-primary-500 focus:ring-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-primary-500/40 focus:border-primary-500 focus:ring-2"
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-2 w-full justify-center"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default Login;

