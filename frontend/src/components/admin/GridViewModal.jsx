import React, { useEffect, useState } from "react";
import apiClient from "../../services/api.js";
import ParkingGrid from "../ParkingGrid.jsx";

/**
 * Real-time Grid Viewer Modal for Admin
 * - Shows live parking grid synced with attendant dashboard
 * - Auto-refreshes every 5 seconds
 * - Premium white modal design
 */
const GridViewModal = ({ isOpen, onClose, level, parkingId }) => {
  const [slots, setSlots] = useState([]);
  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const POLL_INTERVAL = 5000; // 5 seconds - same as attendant dashboard

  // Fetch slots for the level
  const fetchLevelSlots = async () => {
    if (!level?._id) return;

    try {
      setError("");
      const res = await apiClient.get(`/parking/levels/${level._id}/slots`);
      setLevelData(res.data.level);
      setSlots(res.data.slots);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch level slots:", err);
      setError(err.response?.data?.message || "Failed to load slots");
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isOpen && level) {
      setLoading(true);
      fetchLevelSlots();
    }
  }, [isOpen, level]);

  // Auto-refresh
  useEffect(() => {
    if (isOpen && level) {
      const interval = setInterval(() => {
        fetchLevelSlots();
      }, POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isOpen, level]);

  // Calculate statistics
  const stats = {
    total: slots.length,
    available: slots.filter((s) => s.status === "FREE").length,
    occupied: slots.filter((s) => s.status === "OCCUPIED").length,
    reserved: slots.filter((s) => s.status === "RESERVED").length,
    blocked: slots.filter((s) => s.status === "BLOCKED").length
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-premium-lg shadow-soft-xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-150 ease-apple"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Live Grid View - {level?.levelName || "Loading..."}
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              Real-time parking slot status
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors duration-150 rounded-lg p-1 hover:bg-neutral-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="card border-red-200 bg-red-50 p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          {!loading && !error && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 mb-6">
              <div className="card-hover p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                  Total Slots
                </p>
                <p className="text-2xl font-semibold text-neutral-900 tracking-tight">
                  {stats.total}
                </p>
              </div>
              <div className="card-hover p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                  Available
                </p>
                <p className="text-2xl font-semibold text-green-700 tracking-tight">
                  {stats.available}
                </p>
              </div>
              <div className="card-hover p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                  Occupied
                </p>
                <p className="text-2xl font-semibold text-amber-700 tracking-tight">
                  {stats.occupied}
                </p>
              </div>
              <div className="card-hover p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                  Reserved
                </p>
                <p className="text-2xl font-semibold text-blue-700 tracking-tight">
                  {stats.reserved}
                </p>
              </div>
              <div className="card-hover p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                  Blocked
                </p>
                <p className="text-2xl font-semibold text-neutral-500 tracking-tight">
                  {stats.blocked}
                </p>
              </div>
            </div>
          )}

          {/* Live Indicator */}
          {!loading && !error && (
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-base font-semibold text-neutral-900">
                Parking Grid
              </h4>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-neutral-600">
                  Live · {POLL_INTERVAL / 1000}s refresh
                </span>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="section-container">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-neutral-900 mx-auto mb-2"></div>
                  <p className="text-sm text-neutral-500">Loading grid...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-sm text-neutral-500">Failed to load grid</p>
              </div>
            ) : (
              <ParkingGrid
                level={levelData}
                slots={slots}
                onSlotClick={() => {}} // Read-only view, no click action
              />
            )}
          </div>

          {/* Info Note */}
          {!loading && !error && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-premium">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Read-only View</p>
                  <p className="text-xs text-blue-700 mt-1">
                    This is a live view of the parking grid. Changes made by attendants will appear here automatically. 
                    To modify slots, use the attendant dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GridViewModal;
