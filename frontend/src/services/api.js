import axios from "axios";

// For development: Use Vite proxy (just /api)
// For production: Use full URL with IP address
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? "/api"  // Vite proxy will forward to http://localhost:5000/api
  : (import.meta.env.VITE_API_URL || "http://192.168.1.101:5000") + "/api";

console.log("🔧 API Configuration:", {
  mode: isDevelopment ? "development" : "production",
  baseURL: API_BASE_URL
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000 // 10 second timeout
});

// Request interceptor: Add auth token to requests
apiClient.interceptors.request.use((config) => {
  console.log("📤 API Request:", config.method?.toUpperCase(), config.url, "→", config.baseURL + config.url);
  
  const stored = localStorage.getItem("sp_auth");
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error parsing auth from localStorage:", e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
        console.error("Backend server is not running or unreachable");
        error.message = "Cannot connect to server. Make sure the backend is running on port 5000.";
      }
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - clear auth and redirect to login
    if (error.response.status === 401) {
      // Only logout if we're not already on the login page
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("sp_auth");
        // Don't redirect here - let the component handle it
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

