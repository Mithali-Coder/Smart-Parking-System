import React, { useEffect, useState } from "react";
import apiClient from "../../services/api.js";
import { Building2, Search, MapPin, Users, Car, Grid3x3, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AllParkings = () => {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => { fetchParkings(); }, []);

  const fetchParkings = async () => {
    try {
      const res = await apiClient.get("/super-admin/parkings");
      setParkings(res.data.parkings || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = parkings.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "10px 14px 10px 40px",
    color: "white",
    fontSize: "14px",
    outline: "none",
  };

  const buttonStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    border: "1px solid rgba(139,92,246,0.3)",
    background: "rgba(139,92,246,0.1)",
    color: "#a78bfa",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Parkings</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>System-wide view of all parking facilities</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4b5563" }} />
        <input type="text" placeholder="Search parkings by name or location..." value={search}
          onChange={e => setSearch(e.target.value)} style={inputStyle}
          onFocus={e => e.target.style.borderColor = "rgba(139,92,246,0.5)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 rounded-full border-2 border-t-violet-500 animate-spin"
            style={{ borderColor: "rgba(139,92,246,0.2)", borderTopColor: "#8b5cf6" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "#4b5563" }}>
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-white">No parkings found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <div key={p._id} className="rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <Building2 className="w-5 h-5" style={{ color: "#8b5cf6" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" style={{ color: "#6b7280" }} />
                    <p className="text-xs truncate" style={{ color: "#6b7280" }}>{p.address || p.location}</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: p.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: p.isActive ? "#86efac" : "#fca5a5"
                  }}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-xl p-2.5 flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Car className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                  <div>
                    <p className="text-sm font-bold text-white">{p.totalLevels || 1}</p>
                    <p className="text-[10px]" style={{ color: "#6b7280" }}>Levels</p>
                  </div>
                </div>
                <div className="rounded-xl p-2.5 flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Users className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
                  <div>
                    <p className="text-sm font-bold text-white">{p.attendants?.length || 0}</p>
                    <p className="text-[10px]" style={{ color: "#6b7280" }}>Attendants</p>
                  </div>
                </div>
              </div>

              {p.slotStats && (
                <div className="rounded-xl p-3 mb-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Grid3x3 className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />
                    <p className="text-xs font-medium text-white">Slot Statistics</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs font-bold text-white">{p.slotStats.total}</p>
                      <p className="text-[9px]" style={{ color: "#6b7280" }}>Total</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#86efac" }}>{p.slotStats.free}</p>
                      <p className="text-[9px]" style={{ color: "#6b7280" }}>Free</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#fca5a5" }}>{p.slotStats.occupied}</p>
                      <p className="text-[9px]" style={{ color: "#6b7280" }}>Occupied</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#fbbf24" }}>{p.slotStats.reserved}</p>
                      <p className="text-[9px]" style={{ color: "#6b7280" }}>Reserved</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/superadmin/parkings/${p._id}/manage`)}
                  style={buttonStyle}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(139,92,246,0.2)";
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)";
                  }}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage Slots
                </button>
              </div>

              <p className="text-xs mt-3" style={{ color: "#4b5563" }}>Type: {p.type || "Mall"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllParkings;
