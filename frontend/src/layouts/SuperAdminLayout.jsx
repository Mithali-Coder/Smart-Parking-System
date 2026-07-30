import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  Globe,
  Settings,
  Cpu,
} from "lucide-react";

const SuperAdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: "/superadmin", label: "System Overview", icon: LayoutDashboard },
    { path: "/superadmin/admins", label: "Manage Admins", icon: Shield },
    { path: "/superadmin/parkings", label: "All Parkings", icon: Building2 },
    { path: "/superadmin/esp32-monitor", label: "ESP32 Monitor", icon: Cpu },
    { path: "/superadmin/config-module", label: "Config Module", icon: Settings },
    { path: "/superadmin/activity", label: "Activity Log", icon: Activity },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/superadmin") return location.pathname === "/superadmin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col"
        style={{
          width: sidebarOpen ? "260px" : "72px",
          background: "linear-gradient(180deg, #13131a 0%, #0d0d14 100%)",
          borderRight: "1px solid rgba(139, 92, 246, 0.15)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{ height: "64px", borderBottom: "1px solid rgba(139,92,246,0.12)" }}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
              >
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wide">Smart Parking</p>
                <p className="text-xs font-semibold" style={{ color: "#8b5cf6" }}>
                  SUPER ADMIN
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
            >
              <Globe className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(139,92,246,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Badge */}
        {sidebarOpen && (
          <div className="px-4 pt-4">
            <div
              className="rounded-lg px-3 py-2 text-center"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <p className="text-xs font-semibold tracking-widest" style={{ color: "#8b5cf6" }}>
                GLOBAL CONTROL PANEL
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-4 px-3 flex-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-150"
                style={{
                  background: active ? "rgba(139,92,246,0.15)" : "transparent",
                  border: active ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
                  color: active ? "#c4b5fd" : "#6b7280",
                }}
                title={!sidebarOpen ? item.label : ""}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(139,92,246,0.07)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {active && sidebarOpen && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "#8b5cf6" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }}
        >
          {sidebarOpen ? (
            <>
              <div
                className="flex items-center gap-3 p-3 rounded-xl mb-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
                >
                  {user?.name?.charAt(0).toUpperCase() || "S"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name || "Super Admin"}</p>
                  <p className="text-xs truncate" style={{ color: "#6b7280" }}>{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
              >
                {user?.name?.charAt(0).toUpperCase() || "S"}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl transition-colors"
                style={{ color: "#f87171" }}
                title="Logout"
                onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarOpen ? "260px" : "72px" }}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6"
          style={{
            height: "64px",
            background: "rgba(10,10,15,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(139,92,246,0.1)",
          }}
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              {menuItems.find((item) => isActive(item.path))?.label || "Super Admin Panel"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              SUPER ADMIN
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
