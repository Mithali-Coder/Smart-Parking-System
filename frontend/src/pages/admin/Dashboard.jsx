import React, { useEffect, useState } from "react";
import apiClient from "../../services/api.js";
import {
  Building2, Car, CheckCircle2, Users, Calendar, TrendingUp,
  Activity, AlertCircle, RefreshCw
} from "lucide-react";

const KPI = ({ label, value, icon: Icon, color, loading }) => {
  const palettes = {
    blue: { bg: "#eff6ff", border: "#bfdbfe", icon: "#2563eb", text: "#1e3a8a" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", icon: "#16a34a", text: "#14532d" },
    amber: { bg: "#fffbeb", border: "#fde68a", icon: "#d97706", text: "#78350f" },
    purple: { bg: "#faf5ff", border: "#e9d5ff", icon: "#9333ea", text: "#581c87" },
    rose: { bg: "#fff1f2", border: "#fecdd3", icon: "#e11d48", text: "#881337" },
    indigo: { bg: "#eef2ff", border: "#c7d2fe", icon: "#4338ca", text: "#1e1b4b" },
  };
  const c = palettes[color] || palettes.blue;
  return (
    <div className="rounded-2xl p-5 border transition-shadow hover:shadow-md"
      style={{ background: c.bg, borderColor: c.border }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "white", border: `1px solid ${c.border}` }}>
          <Icon className="w-5 h-5" style={{ color: c.icon }} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 rounded-lg animate-pulse" style={{ background: c.border }} />
      ) : (
        <p className="text-3xl font-bold mb-1" style={{ color: c.text }}>{value ?? "—"}</p>
      )}
      <p className="text-sm font-medium" style={{ color: c.icon }}>{label}</p>
    </div>
  );
};

const MiniBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-gray-600 w-28 flex-shrink-0">{label}</p>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-8 text-right">{value}</span>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    setError("");
    setRefreshing(true);
    try {
      const [parkingsRes, slotsRes, attendantsRes, bookingsRes] = await Promise.allSettled([
        apiClient.get("/admin/parkings"),
        apiClient.get("/slots"),
        apiClient.get("/admin/attendants"),
        apiClient.get("/bookings/history"),
      ]);

      const parkingsData = parkingsRes.status === "fulfilled"
        ? (parkingsRes.value.data?.parkings || parkingsRes.value.data || []) : [];
      const slotsData = slotsRes.status === "fulfilled"
        ? (slotsRes.value.data?.slots || slotsRes.value.data || []) : [];
      const attendantsData = attendantsRes.status === "fulfilled"
        ? (attendantsRes.value.data?.attendants || attendantsRes.value.data || []) : [];
      const bookingsData = bookingsRes.status === "fulfilled"
        ? (bookingsRes.value.data?.bookings || bookingsRes.value.data || []) : [];

      const slots = Array.isArray(slotsData) ? slotsData : [];
      const parkingList = Array.isArray(parkingsData) ? parkingsData : [];
      const attendants = Array.isArray(attendantsData) ? attendantsData : [];
      const bookings = Array.isArray(bookingsData) ? bookingsData : [];

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const occupied = slots.filter(s => ["OCCUPIED","occupied","booked"].includes(s.status)).length;
      const free = slots.filter(s => ["FREE","available","free"].includes(s.status)).length;
      const reserved = slots.filter(s => ["RESERVED","reserved"].includes(s.status)).length;
      const blocked = slots.filter(s => ["BLOCKED","blocked"].includes(s.status)).length;
      const todayBookings = bookings.filter(b => new Date(b.createdAt || b.bookingTime) >= today).length;
      const rate = slots.length > 0 ? ((occupied / slots.length) * 100).toFixed(1) : 0;

      setStats({
        totalParkings: parkingList.length, totalSlots: slots.length,
        freeSlots: free, occupiedSlots: occupied, reservedSlots: reserved, blockedSlots: blocked,
        activeAttendants: attendants.filter(a => a.isActive !== false).length,
        totalAttendants: attendants.length,
        todayBookings, totalBookings: bookings.length, occupancyRate: `${rate}%`,
      });
      setParkings(parkingList.slice(0, 5));
      setLastRefreshed(new Date());
    } catch (err) {
      setError("Some data may be unavailable. Check backend connection.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time overview of your parking system</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button onClick={fetchAll} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium text-gray-600 border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI label="Parkings" value={stats?.totalParkings} icon={Building2} color="blue" loading={loading} />
        <KPI label="Total Slots" value={stats?.totalSlots} icon={Car} color="indigo" loading={loading} />
        <KPI label="Available" value={stats?.freeSlots} icon={CheckCircle2} color="green" loading={loading} />
        <KPI label="Occupied" value={stats?.occupiedSlots} icon={Activity} color="amber" loading={loading} />
        <KPI label="Attendants" value={stats?.activeAttendants} icon={Users} color="purple" loading={loading} />
        <KPI label="Today's Bookings" value={stats?.todayBookings} icon={Calendar} color="rose" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Slot Distribution</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-5 rounded animate-pulse bg-gray-100"/>)}</div>
          ) : stats?.totalSlots === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Car className="w-8 h-8 mb-2 opacity-30"/>
              <p className="text-sm">No slots configured yet</p>
              <p className="text-xs mt-1">Add parkings and configure grids first</p>
            </div>
          ) : (
            <div className="space-y-4">
              <MiniBar label="Available" value={stats?.freeSlots??0} max={stats?.totalSlots??1} color="#22c55e"/>
              <MiniBar label="Occupied" value={stats?.occupiedSlots??0} max={stats?.totalSlots??1} color="#f59e0b"/>
              <MiniBar label="Reserved" value={stats?.reservedSlots??0} max={stats?.totalSlots??1} color="#3b82f6"/>
              <MiniBar label="Blocked" value={stats?.blockedSlots??0} max={stats?.totalSlots??1} color="#e5e7eb"/>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500 font-medium">Overall Occupancy</span>
                  <span className="text-lg font-bold text-gray-900">{stats?.occupancyRate}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-700"
                    style={{ width: stats?.occupancyRate||"0%", background: "linear-gradient(90deg, #22c55e, #f59e0b)" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-blue-600"/>
            <h3 className="text-base font-semibold text-gray-900">Your Parkings</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-14 rounded-xl animate-pulse bg-gray-50"/>)}</div>
          ) : parkings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Building2 className="w-8 h-8 mb-2 opacity-30"/>
              <p className="text-sm">No parkings yet</p>
              <p className="text-xs mt-1">Go to Parking Management to add one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {parkings.map(p => (
                <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{background:"#eff6ff",border:"1px solid #bfdbfe"}}>
                    <Building2 className="w-4 h-4 text-blue-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.address||p.location||"—"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{background:p.isActive!==false?"#f0fdf4":"#fef2f2",color:p.isActive!==false?"#16a34a":"#dc2626"}}>
                    {p.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {label:"Total Bookings (All Time)",value:stats?.totalBookings??"—",color:"#4f46e5",bg:"#eef2ff"},
          {label:"Total Attendants",value:stats?.totalAttendants??"—",color:"#9333ea",bg:"#faf5ff"},
          {label:"Reserved Slots Now",value:stats?.reservedSlots??"—",color:"#0284c7",bg:"#f0f9ff"},
        ].map(item=>(
          <div key={item.label} className="rounded-2xl p-4 flex items-center gap-4 border border-gray-100"
            style={{background:item.bg}}>
            <p className="text-3xl font-bold" style={{color:item.color}}>{item.value}</p>
            <p className="text-sm font-medium text-gray-600">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
