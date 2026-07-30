import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../services/api.js";
import { ArrowLeft, Building2, Grid3x3, RefreshCw, CheckSquare, Square } from "lucide-react";

const ManageParkingSlots = () => {
  const { parkingId } = useParams();
  const navigate = useNavigate();
  const [parking, setParking] = useState(null);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("FREE");

  useEffect(() => {
    fetchParkingDetails();
  }, [parkingId]);

  const fetchParkingDetails = async () => {
    try {
      const res = await apiClient.get(`/super-admin/parkings/${parkingId}`);
      setParking(res.data.parking);
      setLevels(res.data.levels || []);
      if (res.data.levels?.length > 0) {
        setSelectedLevel(res.data.levels[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateSlotStatus = async (slotId, status) => {
    try {
      await apiClient.put(`/super-admin/slots/${slotId}/status`, { status });
      fetchParkingDetails();
    } catch (e) {
      console.error(e);
      alert("Failed to update slot status");
    }
  };

  const bulkUpdateSlots = async () => {
    if (selectedSlots.length === 0) {
      alert("Please select slots to update");
      return;
    }

    try {
      await apiClient.post("/super-admin/slots/bulk-update", {
        slotIds: selectedSlots,
        status: bulkStatus
      });
      setSelectedSlots([]);
      fetchParkingDetails();
    } catch (e) {
      console.error(e);
      alert("Failed to bulk update slots");
    }
  };

  const toggleSlotSelection = (slotId) => {
    setSelectedSlots(prev =>
      prev.includes(slotId)
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const selectAllSlots = () => {
    if (!selectedLevel) return;
    const allSlotIds = selectedLevel.slots.map(s => s._id);
    setSelectedSlots(allSlotIds);
  };

  const clearSelection = () => {
    setSelectedSlots([]);
  };

  const getStatusColor = (status) => {
    const normalized = status?.toUpperCase();
    switch (normalized) {
      case "FREE":
      case "AVAILABLE":
        return { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", text: "#86efac" };
      case "OCCUPIED":
        return { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#fca5a5" };
      case "RESERVED":
      case "BOOKED":
        return { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", text: "#fbbf24" };
      case "BLOCKED":
        return { bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.3)", text: "#9ca3af" };
      default:
        return { bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.3)", text: "#a78bfa" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-t-violet-500 animate-spin"
          style={{ borderColor: "rgba(139,92,246,0.2)", borderTopColor: "#8b5cf6" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/superadmin/parkings")}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{parking?.name}</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>Manage parking slots at root level</p>
        </div>
      </div>

      {/* Level Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {levels.map(level => (
          <button
            key={level._id}
            onClick={() => {
              setSelectedLevel(level);
              setSelectedSlots([]);
            }}
            className="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all"
            style={{
              background: selectedLevel?._id === level._id ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${selectedLevel?._id === level._id ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: selectedLevel?._id === level._id ? "#a78bfa" : "#9ca3af"
            }}
          >
            {level.levelName} ({level.slots?.length || 0} slots)
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedLevel && (
        <div className="rounded-xl p-4 flex flex-wrap items-center gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-sm font-medium text-white">
            {selectedSlots.length > 0
              ? `${selectedSlots.length} slot${selectedSlots.length > 1 ? "s" : ""} selected`
              : "Select slots to bulk update"}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white"
              }}
            >
              <option value="FREE">Free</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <button
              onClick={selectAllSlots}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#9ca3af"
              }}
            >
              Select All
            </button>
            {selectedSlots.length > 0 && (
              <>
                <button
                  onClick={bulkUpdateSlots}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium"
                  style={{
                    background: "rgba(139,92,246,0.2)",
                    border: "1px solid rgba(139,92,246,0.5)",
                    color: "#a78bfa"
                  }}
                >
                  Apply
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#9ca3af"
                  }}
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Slot Grid */}
      {selectedLevel && (
        <div className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" style={{ color: "#8b5cf6" }} />
              <h2 className="text-lg font-semibold text-white">{selectedLevel.levelName}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs" style={{ color: "#6b7280" }}>
                {[
                  { label: "Free", color: "#86efac" },
                  { label: "Occupied", color: "#fca5a5" },
                  { label: "Reserved", color: "#fbbf24" },
                  { label: "Blocked", color: "#9ca3af" },
                ].map(({ label, color }) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color, opacity: 0.7 }} />
                    {label}
                  </span>
                ))}
              </div>
              <button
                onClick={fetchParkingDetails}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {selectedLevel.slots && selectedLevel.slots.length > 0 ? (
            <div className="space-y-4">
              {/* Derive unique rows from slots, sorted alphabetically */}
              {[...new Set(selectedLevel.slots.map(s => s.row))].sort().map(row => (
                <div key={row} className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: "#6b7280" }}>Row {row}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedLevel.slots
                      .filter(slot => slot.row === row)
                      .sort((a, b) => a.column - b.column)
                      .map(slot => {
                        const colors = getStatusColor(slot.status);
                        const isSelected = selectedSlots.includes(slot._id);
                        return (
                          <div
                            key={slot._id}
                            className="relative rounded-lg p-3 cursor-pointer transition-all hover:scale-105 select-none"
                            style={{
                              minWidth: "72px",
                              background: isSelected ? "rgba(139,92,246,0.2)" : colors.bg,
                              border: `2px solid ${isSelected ? "rgba(139,92,246,0.6)" : colors.border}`
                            }}
                            onClick={() => toggleSlotSelection(slot._id)}
                          >
                            {isSelected && (
                              <CheckSquare className="absolute top-1 right-1 w-3 h-3" style={{ color: "#a78bfa" }} />
                            )}
                            <p className="text-xs font-bold text-white">{slot.slotId}</p>
                            <p className="text-[10px] mt-0.5 capitalize" style={{ color: colors.text }}>
                              {slot.status?.toLowerCase()}
                            </p>
                            {/* Right-click context menu via dropdown */}
                            <select
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                if (e.target.value) {
                                  updateSlotStatus(slot._id, e.target.value);
                                  e.target.value = "";
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Change status</option>
                              <option value="FREE">Free</option>
                              <option value="OCCUPIED">Occupied</option>
                              <option value="RESERVED">Reserved</option>
                              <option value="BLOCKED">Blocked</option>
                            </select>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: "#6b7280" }}>No slots found for this level</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageParkingSlots;
