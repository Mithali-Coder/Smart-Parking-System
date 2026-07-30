import React, { useEffect, useState } from "react";
import apiClient from "../../services/api.js";
import {
  Building2, Users, Shield, Car, TrendingUp, Calendar,
  CheckCircle2, Clock, AlertCircle
} from "lucide-react";

const StatCard = ({ label, value, icon: Icon, color, subtitle }) => {
  const colors = {
    violet: { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)", text: "#a78bfa", icon: "#8b5cf6" },
    blue: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", text: "#93c5fd", icon: "#3b82f6" },
    green: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", text: "#86efac", icon: "#22c55e" },
    amber: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "#fcd34d", icon: "#f59e0b" },
    rose: { bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.2)", text: "#fda4af", icon: "#f43f5e" },
    cyan: { bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.2)", text: "#67e8f9", icon: "#06b6d4" },
  };
  const c = colors[color] || colors.violet;

  return (
    <div
      className="rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${c.border}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: c.bg }}
        >
          <Icon className="w-5 h-5" style={{ color: c.icon }} />
        </div>
        {subtitle && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>
            {subtitle}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value ?? "—"}</p>
      <p className="text-sm" style={{ color: "#6b7280" }}>{label}</p>
    </div>
  );
};

const SuperAdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, adminsRes] = await Promise.allSettled([
        apiClient.get("/super-admin/stats"),
        apiClient.get("/super-admin/admins"),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (adminsRes.status === "fulfilled") setAdmins(adminsRes.value.data.admins || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-violet-500 animate-spin"
            style={{ borderColor: "rgba(139,92,246,0.2)", borderTopColor: "#8b5cf6" }}
          />
          <p className="text-sm" style={{ color: "#6b7280" }}>Loading system data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">System Overview</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          Global stats across all admins, parkings and slots
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Admins" value={stats?.totalAdmins} icon={Shield} color="violet" />
        <StatCard label="Attendants" value={stats?.totalAttendants} icon={Users} color="blue" />
        <StatCard label="Parkings" value={stats?.totalParkings} icon={Building2} color="cyan" />
        <StatCard label="Total Slots" value={stats?.totalSlots} icon={Car} color="amber" />
        <StatCard label="Available Slots" value={stats?.freeSlots} icon={CheckCircle2} color="green" />
        <StatCard label="Occupancy" value={stats?.occupancyRate} icon={TrendingUp} color="rose" subtitle="Live" />
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4" style={{ color: "#8b5cf6" }} />
            <h3 className="text-sm font-semibold text-white">Today's Activity</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Bookings Today", value: stats?.todayBookings ?? 0, color: "#22c55e" },
              { label: "Occupied Slots", value: stats?.occupiedSlots ?? 0, color: "#f59e0b" },
              { label: "Reserved Slots", value: stats?.reservedSlots ?? 0, color: "#3b82f6" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#9ca3af" }}>{item.label}</span>
                <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admins Summary */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4" style={{ color: "#8b5cf6" }} />
            <h3 className="text-sm font-semibold text-white">Admin Accounts</h3>
          </div>
          {admins.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "#4b5563" }}>
              No admins yet. Create one from Manage Admins.
            </p>
          ) : (
            <div className="space-y-2">
              {admins.slice(0, 4).map(admin => (
                <div key={admin._id} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
                  >
                    {admin.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{admin.name}</p>
                    <p className="text-xs truncate" style={{ color: "#6b7280" }}>{admin.email}</p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: admin.isActive ? "#22c55e" : "#ef4444" }}
                  />
                </div>
              ))}
              {admins.length > 4 && (
                <p className="text-xs text-center pt-1" style={{ color: "#6b7280" }}>
                  +{admins.length - 4} more admins
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
