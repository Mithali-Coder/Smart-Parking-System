import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import {
  LayoutDashboard,
  Car,
  Grid3x3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * Premium Admin Layout - Apple/Linear inspired
 * - Clean white sidebar with subtle shadows
 * - Minimal navigation with icons
 * - Premium user profile section
 * - Smooth transitions and hover states
 */
const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/parkings", label: "Parking Management", icon: Car },
    { path: "/admin/grids", label: "Grid Management", icon: Grid3x3 },
    { path: "/admin/attendants", label: "Attendant Management", icon: Users },
    { path: "/admin/settings", label: "Settings", icon: Settings }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar - Premium white design */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-neutral-200 transition-all duration-300 ease-apple shadow-soft ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo Section - Minimal and clean */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">SP</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-neutral-900">Smart Parking</h1>
                <p className="text-xs text-neutral-500">Admin Portal</p>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center mx-auto">
              <span className="text-sm font-semibold text-white">SP</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-all duration-150 ease-apple ${
              !sidebarOpen ? "absolute top-4 right-2" : ""
            }`}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation - Clean and minimal */}
        <nav className="mt-6 px-3">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-premium transition-all duration-150 ease-apple ${
                isActive(item.path)
                  ? "bg-neutral-900 text-white shadow-soft"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
              title={!sidebarOpen ? item.label : ""}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section - Premium profile card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 bg-neutral-50">
          {sidebarOpen ? (
            <>
              {/* Expanded user profile */}
              <div className="flex items-center gap-3 mb-3 p-3 rounded-premium bg-white border border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email || "admin@example.com"}</p>
                </div>
              </div>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-premium transition-all duration-150 ease-apple border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* Collapsed user profile */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-premium transition-all duration-150 ease-apple"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-apple ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Top Bar - Minimal and clean */}
        <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-soft">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {menuItems.find((item) => isActive(item.path))?.label || "Admin Panel"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200">
              <span className="text-xs font-medium text-neutral-700">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
