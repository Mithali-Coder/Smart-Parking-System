import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./state/AuthContext.jsx";
import { AttendantNavProvider } from "./state/AttendantNavContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AttendantNavProvider>
          <App />
        </AttendantNavProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

