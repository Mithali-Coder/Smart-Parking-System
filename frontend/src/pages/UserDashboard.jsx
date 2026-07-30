import React, { useEffect, useState } from "react";
import apiClient from "../services/api.js";

const POLL_MS = 5000;

const S = {
  FREE:      { bg: "#21c55d", border: "#15803d", text: "#fff",    label: "Available" },
  OCCUPIED:  { bg: "#ef4444", border: "#dc2626", text: "#fff",    label: "Occupied"  },
  RESERVED:  { bg: "#3b82f6", border: "#2563eb", text: "#fff",    label: "Reserved"  },
  BLOCKED:   { bg: "#374151", border: "#374151", text: "#6b7280", label: "Blocked"   },
  PENDING:   { bg: "#94a3b8", border: "#64748b", text: "#fff",    label: "Pending"   },
  available: { bg: "#21c55d", border: "#15803d", text: "#fff",    label: "Available" },
  booked:    { bg: "#ef4444", border: "#dc2626", text: "#fff",    label: "Occupied"  },
};

const Seat = ({ slot }) => {
  const cfg = S[slot.status] || S.BLOCKED;
  const label = slot.slotLabel || slot.slotId || `${slot.slotNumber}`;
  const vehicle = slot.status === "OCCUPIED" && slot.vehicleNumber ? slot.vehicleNumber.slice(-4) : null;

  return (
    <div
      title={`${label} · ${cfg.label}${slot.vehicleNumber ? ` · ${slot.vehicleNumber}` : ""}${slot.sensorId ? ` · 📡 ${slot.sensorId}` : ""}`}
      style={{
        width: 46, height: 38, flexShrink: 0,
        borderRadius: "6px 6px 4px 4px",
        background: cfg.bg, borderBottom: `3px solid ${cfg.border}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", cursor: "default", userSelect: "none",
      }}
    >
      {slot.sensorId && (
        <div style={{
          position: "absolute", top: 2, right: 2,
          width: 4, height: 4, borderRadius: "50%",
          background: slot.status === "FREE" ? "#86efac" : "#fca5a5",
          animation: "sdot 2s infinite",
        }} />
      )}
      {vehicle ? (
        <>
          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.7)", lineHeight: 1, marginBottom: 1 }}>{label}</span>
          <span style={{ fontSize: 8, color: "#fff", fontWeight: 800, lineHeight: 1 }}>{vehicle}</span>
        </>
      ) : (
        <span style={{ fontSize: 10, color: cfg.text, fontWeight: 700, lineHeight: 1 }}>{label}</span>
      )}
    </div>
  );
};

export default function UserDashboard() {
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const fetchSlots = async () => {
    try {
      const res = await apiClient.get("/slots");
      const data = Array.isArray(res.data) ? res.data : (res.data?.slots || []);
      setSlots(data);
      setLastSync(new Date());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSlots();
    const id = setInterval(fetchSlots, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const COLS = 8;
  const sorted = [...slots].sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
  const rowCount = Math.ceil(sorted.length / COLS);
  const grid = Array.from({ length: rowCount }, (_, ri) => sorted.slice(ri * COLS, ri * COLS + COLS));
  const aisle = Math.floor(COLS / 2) - 1;

  const free     = slots.filter(s => ["FREE","available"].includes(s.status)).length;
  const occupied = slots.filter(s => ["OCCUPIED","booked"].includes(s.status)).length;
  const reserved = slots.filter(s => ["RESERVED"].includes(s.status)).length;
  const pending  = slots.filter(s => s.status === "PENDING").length;
  const pct      = slots.length > 0 ? Math.round((occupied / slots.length) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @keyframes sdot { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#21c55d", letterSpacing: "0.12em", marginBottom: 4 }}>USER PORTAL</div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#f1f5f9" }}>Live Parking Availability</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>
              Real-time view. Approach the entry gate to book a slot with the attendant.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 24, background: "#0d1f0f", border: "1px solid #166534", fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "sdot 1.5s infinite" }} />
            Live · {POLL_MS / 1000}s
            {lastSync && <span style={{ color: "#475569", fontWeight: 400 }}>&nbsp; {lastSync.toLocaleTimeString()}</span>}
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          {[
            { label: "TOTAL",    val: slots.length, color: "#64748b" },
            { label: "FREE",     val: free,          color: "#21c55d" },
            { label: "OCCUPIED", val: occupied,       color: "#ef4444" },
            { label: "RESERVED", val: reserved,       color: "#3b82f6" },
            ...(pending > 0 ? [{ label: "PENDING", val: pending, color: "#f59e0b" }] : []),
          ].map(s => (
            <div key={s.label} style={{
              padding: "10px 18px", borderRadius: 12,
              background: s.color + "18", border: `1px solid ${s.color}30`,
              display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70,
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</span>
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginTop: 3, letterSpacing: "0.06em" }}>{s.label}</span>
            </div>
          ))}
          {slots.length > 0 && (
            <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 16px", borderRadius: 12, background: "#1e293b", border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                <span style={{ fontWeight: 700 }}>OCCUPANCY</span>
                <span style={{ color: pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#21c55d", fontWeight: 800 }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : "#21c55d", transition: "width 0.5s" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Grid Panel ── */}
        <div style={{ background: "#1e293b", borderRadius: 20, border: "1px solid #334155", overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.4)" }}>

          <div style={{ padding: "16px 24px", borderBottom: "1px solid #0f172a", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#f1f5f9" }}>Parking Grid (Read-only)</p>
            {/* Legend */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[
                { label: "Available", bg: "#21c55d", border: "#15803d" },
                { label: "Occupied",  bg: "#ef4444", border: "#dc2626" },
                { label: "Reserved",  bg: "#3b82f6", border: "#2563eb" },
                { label: "Pending",   bg: "#94a3b8", border: "#64748b" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, borderBottom: `2px solid ${l.border}` }} />
                  <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#0f172a", margin: "16px 24px 0", borderRadius: 8, padding: "7px 0", textAlign: "center" }}>
            <span style={{ fontSize: 10, color: "#475569", fontWeight: 800, letterSpacing: "0.2em" }}>▼ &nbsp; ENTRY / EXIT &nbsp; ▼</span>
          </div>

          <div style={{ padding: "16px 24px 24px", overflowX: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>Loading slots…</div>
            ) : slots.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🅿️</div>
                <p style={{ fontSize: 14 }}>No slots available.</p>
              </div>
            ) : (
              <div style={{ display: "inline-block", minWidth: "fit-content" }}>
                {grid.map((row, ri) => (
                  <div key={ri} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                    <div style={{ width: 22, flexShrink: 0, textAlign: "right", marginRight: 6, fontSize: 12, fontWeight: 800, color: "#94a3b8" }}>
                      {String.fromCharCode(65 + ri)}
                    </div>
                    {Array.from({ length: COLS }, (_, ci) => {
                      const slot = row[ci];
                      return (
                        <React.Fragment key={ci}>
                          {slot
                            ? <Seat slot={slot} />
                            : <div style={{ width: 46, height: 38, flexShrink: 0, borderRadius: 6, background: "#0f172a", border: "1px solid #1e293b" }} />
                          }
                          {ci === aisle && (
                            <div style={{ width: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <div style={{ width: 1, height: 38, background: "repeating-linear-gradient(to bottom,#334155 0,#334155 4px,transparent 4px,transparent 8px)" }} />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                  <div style={{ width: 28, flexShrink: 0 }} />
                  {Array.from({ length: COLS }, (_, ci) => (
                    <React.Fragment key={ci}>
                      <div style={{ width: 46, flexShrink: 0, textAlign: "center", fontSize: 10, fontWeight: 600, color: "#334155" }}>
                        {String(ci + 1).padStart(2, "0")}
                      </div>
                      {ci === aisle && <div style={{ width: 20, flexShrink: 0 }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 14, padding: "10px 16px", borderRadius: 10, background: "#0f172a", border: "1px solid #1e293b", fontSize: 12, color: "#475569" }}>
          ℹ️ &nbsp; This is a <strong style={{ color: "#64748b" }}>live read-only view</strong>. Slots are managed by the parking attendant at the entry gate. Walk up to the gate to get your slot booked.
        </div>
      </div>
    </div>
  );
}
