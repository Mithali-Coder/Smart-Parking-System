import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import AttendantDashboard from "./pages/AttendantDashboard.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import SuperAdminLayout from "./layouts/SuperAdminLayout.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import ParkingManagement from "./pages/admin/ParkingManagement.jsx";
import GridManagement from "./pages/admin/GridManagement.jsx";
import AttendantManagement from "./pages/admin/AttendantManagement.jsx";
import SuperAdminOverview from "./pages/superadmin/Overview.jsx";
import ManageAdmins from "./pages/superadmin/ManageAdmins.jsx";
import AllParkings from "./pages/superadmin/AllParkings.jsx";
import ManageParkingSlots from "./pages/superadmin/ManageParkingSlots.jsx";
import ConfigModule from "./pages/superadmin/ConfigModule.jsx";
import ESP32Monitor from "./pages/superadmin/ESP32Monitor.jsx";
import ESP32ActivityLog from "./pages/superadmin/ESP32ActivityLog.jsx";
import Navbar from "./components/Navbar.jsx";
import { useAuth } from "./state/AuthContext.jsx";

const ProtectedRoute = ({ children, roles }) => {
  const { user, hydrated } = useAuth();
  if (!hydrated) return null; // wait for localStorage restore before deciding
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};

const HomeRedirect = () => {
  const { user, hydrated } = useAuth();
  if (!hydrated) return null; // wait for localStorage restore before deciding
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "super_admin") return <Navigate to="/superadmin" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "attendant") return <Navigate to="/attendant" replace />;
  return <Navigate to="/user" replace />;
};

const App = () => {
  const { user } = useAuth();
  const path = window.location.pathname;
  const isAdminOrSuper = path.startsWith("/admin") || path.startsWith("/superadmin");

  return (
    <div className={isAdminOrSuper ? "min-h-screen" : "min-h-screen bg-white"}>
      {!isAdminOrSuper && <Navbar />}
      <main className={isAdminOrSuper ? "" : "mx-auto max-w-7xl px-6 pb-8 pt-20"}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* User */}
          <Route path="/user" element={
            <ProtectedRoute roles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          } />

          {/* Attendant */}
          <Route path="/attendant" element={
            <ProtectedRoute roles={["attendant"]}>
              <AttendantDashboard />
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/parkings" element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminLayout><ParkingManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/grids" element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminLayout><GridManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendants" element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminLayout><AttendantManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminLayout>
                <div className="p-8 text-center text-gray-600">Settings — Coming soon</div>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Super Admin routes */}
          <Route path="/superadmin" element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminLayout><SuperAdminOverview /></SuperAdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/superadmin/admins" element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminLayout><ManageAdmins /></SuperAdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/superadmin/parkings" element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminLayout><AllParkings /></SuperAdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/superadmin/parkings/:parkingId/manage" element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminLayout><ManageParkingSlots /></SuperAdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/superadmin/esp32-monitor" element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminLayout><ESP32Monitor /></SuperAdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/superadmin/config-module" element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminLayout><ConfigModule /></SuperAdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/superadmin/activity" element={
            <ProtectedRoute roles={["super_admin"]}>
              <SuperAdminLayout><ESP32ActivityLog /></SuperAdminLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
