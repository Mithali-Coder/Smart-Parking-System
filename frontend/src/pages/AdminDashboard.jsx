import React, { useEffect, useState } from "react";
import apiClient from "../services/api.js";
import StatsCard from "../components/StatsCard.jsx";
import SlotGrid from "../components/SlotGrid.jsx";

const POLL_INTERVAL = 7000;

const AdminDashboard = () => {
  const [slots, setSlots] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchSlots = async () => {
    try {
      const res = await apiClient.get("/slots");
      setSlots(res.data);
    } catch (error) {
      console.error("Failed to load slots", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get("/bookings/history");
      setHistory(res.data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchHistory();
    const id = setInterval(fetchSlots, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const total = slots.length;
  const free = slots.filter((s) => s.status === "FREE").length;
  const occupied = slots.filter((s) => s.status === "OCCUPIED").length;
  const reserved = slots.filter((s) => s.status === "RESERVED").length;

  // Mock sensor health: based on lastUpdated recency
  const now = Date.now();
  const healthySensors = slots.filter(
    (s) => s.lastUpdated && now - new Date(s.lastUpdated).getTime() < 5 * 60 * 1000
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Admin Dashboard</h2>
          <p className="text-sm text-slate-400">
            High-level overview of utilization, sensor health, and booking history.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard label="Total Slots" value={total} />
        <StatsCard label="Occupied" value={occupied} />
        <StatsCard label="Free" value={free} />
        <StatsCard
          label="Reserved"
          value={reserved}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4 md:col-span-2">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <p>Parking Layout</p>
            <span>Auto-refresh · {POLL_INTERVAL / 1000}s</span>
          </div>
          {loadingSlots ? (
            <p className="text-sm text-slate-400">Loading slots...</p>
          ) : (
            <SlotGrid slots={slots} />
          )}
        </div>

        <div className="card flex flex-col gap-3 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Sensor Health (Mock)
          </p>
          <p className="text-2xl font-semibold">
            {healthySensors}
            <span className="ml-2 text-xs font-normal text-slate-400">
              / {slots.length} reporting
            </span>
          </p>
          <p className="text-xs text-slate-400">
            A sensor is considered <span className="text-emerald-300">healthy</span> if it
            updated within the last 5 minutes. This is a mocked metric that can be connected
            to real hardware later.
          </p>
        </div>
      </div>

      <div className="card p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
          Booking History
        </p>
        {loadingHistory ? (
          <p className="text-sm text-slate-400">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Slot</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Booked At</th>
                  <th className="px-2 py-2">Expires</th>
                </tr>
              </thead>
              <tbody>
                {history.map((b) => (
                  <tr key={b._id} className="border-b border-slate-900/80">
                    <td className="px-2 py-2">
                      <div className="flex flex-col">
                        <span>{b.userId?.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {b.userId?.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm">
                      {b.slotId?.slotNumber ? `#${b.slotId.slotNumber}` : "-"}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 uppercase tracking-wide">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-400">
                      {new Date(b.bookingTime).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-400">
                      {new Date(b.expiryTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

