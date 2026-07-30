import React, { useEffect, useState, useCallback, useRef } from "react";
import apiClient from "../services/api.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useAttendantNav } from "../state/AttendantNavContext.jsx";

const POLL_MS = 3000;

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const S = {
  FREE:     { bg: "#22C55E", border: "#16A34A", text: "#fff",     label: "Available", icon: "✓",  clickable: true  },
  OCCUPIED: { bg: "#EF4444", border: "#DC2626", text: "#fff",     label: "Occupied",  icon: "🚗", clickable: false },
  RESERVED: { bg: "#3B82F6", border: "#2563EB", text: "#fff",     label: "Reserved",  icon: "🔒", clickable: false },
  BLOCKED:  { bg: "#9CA3AF", border: "#6B7280", text: "#fff",     label: "Blocked",   icon: "⛔", clickable: false },
  PENDING:  { bg: "#F59E0B", border: "#D97706", text: "#fff",     label: "Pending",   icon: "⏳", clickable: false },
};

// ─── SEAT TILE ────────────────────────────────────────────────────────────────
const Seat = ({ slot, onPress, myPending, slotSize = 88 }) => {
  const [hov, setHov] = useState(false);
  const cfg = S[slot.status] || S.BLOCKED;
  const isMyPending = myPending === slot.id;
  const showSpinner = isMyPending && slot.status === "PENDING";

  const label = slot.slotLabel || slot.slotId || `${slot.slotNumber}`;
  const vehicle = slot.status === "OCCUPIED" && slot.vehicleNumber
    ? slot.vehicleNumber : null;

  return (
    <div
      onMouseEnter={() => cfg.clickable && setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => cfg.clickable && onPress(slot)}
      title={[
        label,
        cfg.label,
        slot.vehicleNumber ? `🚗 ${slot.vehicleNumber}` : null,
        slot.sensorId ? `📡 ${slot.sensorId}` : null,
        slot.lastUpdated ? new Date(slot.lastUpdated).toLocaleTimeString() : null,
      ].filter(Boolean).join("  ·  ")}
      style={{
        width: slotSize,
        height: slotSize,
        flexShrink: 0,
        borderRadius: 12,
        background: cfg.bg,
        border: `2px solid ${cfg.border}`,
        boxShadow: hov && cfg.clickable
          ? "0 4px 16px rgba(34,197,94,0.35)"
          : slot.status === "PENDING"
          ? "0 0 0 3px #FDE68A"
          : "0 1px 3px rgba(0,0,0,0.10)",
        cursor: cfg.clickable ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        position: "relative",
        transition: "transform 0.1s, box-shadow 0.1s",
        transform: hov && cfg.clickable ? "translateY(-2px) scale(1.04)" : "scale(1)",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Sensor pulse dot */}
      {slot.sensorId && (
        <div style={{
          position: "absolute", top: 5, right: 5,
          width: 6, height: 6, borderRadius: "50%",
          background: "rgba(255,255,255,0.7)",
          animation: "sdot 2s infinite",
        }} />
      )}

      {showSpinner ? (
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.4)",
          borderTopColor: "#fff",
          animation: "spin 0.6s linear infinite",
        }} />
      ) : (
        <>
          {/* Slot ID */}
          <span style={{
            fontSize: 15,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1,
            letterSpacing: "0.02em",
          }}>
            {label}
          </span>

          {/* Vehicle number or status icon */}
          {vehicle ? (
            <span style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 600,
              lineHeight: 1,
              maxWidth: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}>
              {vehicle}
            </span>
          ) : (
            <span style={{ fontSize: 14, lineHeight: 1 }}>{cfg.icon}</span>
          )}
        </>
      )}
    </div>
  );
};

// ─── GRID WITH CONTEXT (right-click support) ──────────────────────────────────
function GridWithContext({ slots, levelData, onSeatPress, myPending }) {
  const { rows, cols, rowLabels, colLabels, grid } = React.useMemo(() => {
    if (!slots?.length) return { rows: 0, cols: 0, rowLabels: [], colLabels: [], grid: [] };
    let r, c, rl, cl;
    if (levelData?.rows && levelData?.columns) {
      r = Array.isArray(levelData.rows) ? levelData.rows.length : levelData.rows;
      c = levelData.columns;
      rl = Array.isArray(levelData.rows) ? levelData.rows : Array.from({ length: r }, (_, i) => String.fromCharCode(65 + i));
      cl = levelData.columnLabels || Array.from({ length: c }, (_, i) => String(i + 1).padStart(2, "0"));
    } else {
      c = 8; r = Math.ceil(slots.length / c);
      rl = Array.from({ length: r }, (_, i) => String.fromCharCode(65 + i));
      cl = Array.from({ length: c }, (_, i) => String(i + 1).padStart(2, "0"));
    }
    const g = Array.from({ length: r }, () => Array(c).fill(null));
    slots.forEach(s => {
      if (s.rowIndex >= 0 && s.rowIndex < r && s.columnIndex >= 0 && s.columnIndex < c)
        g[s.rowIndex][s.columnIndex] = s;
    });
    if (g.every(row => row.every(cell => !cell))) {
      const sorted = [...slots].sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
      sorted.forEach((s, i) => { const ri = Math.floor(i / c); const ci = i % c; if (ri < r) g[ri][ci] = s; });
    }
    return { rows: r, cols: c, rowLabels: rl, colLabels: cl, grid: g };
  }, [slots, levelData]);

  if (!rows) return (
    <div style={{ textAlign: "center", color: "#6B7280", padding: "48px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🅿️</div>
      <p style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>No slots configured</p>
      <p style={{ fontSize: 14, marginTop: 4, color: "#6B7280" }}>Configure grid in Admin → Grid Management.</p>
    </div>
  );

  const aisle = Math.floor(cols / 2) - 1;

  // Fixed dimensions — every slot, gap, label, and aisle use the same constant
  // so both halves of the grid are perfectly mirror-symmetric.
  const SLOT  = 88;   // slot width & height (px)
  const GAP   = 10;   // gap between every slot (px)
  const LABEL = 36;   // row-label column width (px)
  const AISLE = 32;   // driving-lane divider width (px)

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      {/* Center the entire grid block horizontally */}
      <div style={{ display: "flex", justifyContent: "center", minWidth: "fit-content" }}>
        <div>
          {grid.map((row, ri) => (
            <div
              key={ri}
              style={{
                display: "flex",
                alignItems: "center",
                gap: GAP,
                marginBottom: GAP,
              }}
            >
              {/* Row label — fixed width, same as trailing spacer */}
              <div style={{
                width: LABEL,
                flexShrink: 0,
                textAlign: "center",
                fontSize: 14, fontWeight: 800, color: "#6B7280",
                background: "#F4F5F7", borderRadius: 6,
                padding: "4px 0",
                border: "1px solid #E4E7EC",
                alignSelf: "stretch",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {rowLabels[ri]}
              </div>

              {/* Slots */}
              {Array.from({ length: cols }, (_, ci) => {
                const slot = row[ci];
                return (
                  <React.Fragment key={ci}>
                    <div data-slotid={slot?.id} style={{ flexShrink: 0 }}>
                      {slot
                        ? <Seat slot={slot} onPress={onSeatPress} myPending={myPending} slotSize={SLOT} />
                        : <div style={{
                            width: SLOT, height: SLOT,
                            borderRadius: 12,
                            background: "#F4F5F7",
                            border: "1px dashed #E4E7EC",
                          }} />
                      }
                    </div>

                    {/* Aisle divider — fixed width, centered dashed line */}
                    {ci === aisle && (
                      <div style={{
                        width: AISLE,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <div style={{
                          width: 2,
                          height: SLOT,
                          background: "repeating-linear-gradient(to bottom, #CBD5E1 0, #CBD5E1 5px, transparent 5px, transparent 10px)",
                          borderRadius: 2,
                        }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Trailing spacer — mirrors the row-label width so slots are centered */}
              <div style={{ width: LABEL, flexShrink: 0 }} />
            </div>
          ))}

          {/* Column numbers row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: GAP,
            marginTop: 4,
          }}>
            {/* Spacer matching row label */}
            <div style={{ width: LABEL, flexShrink: 0 }} />

            {Array.from({ length: cols }, (_, ci) => (
              <React.Fragment key={ci}>
                <div style={{
                  width: SLOT,
                  flexShrink: 0,
                  textAlign: "center",
                  fontSize: 12, fontWeight: 700, color: "#9CA3AF",
                }}>
                  {colLabels[ci]}
                </div>
                {ci === aisle && <div style={{ width: AISLE, flexShrink: 0 }} />}
              </React.Fragment>
            ))}

            {/* Trailing spacer matching row label */}
            <div style={{ width: LABEL, flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────
const BookModal = ({ slot, onClose, onBook }) => {
  const [vehicle, setVehicle] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setVehicle(""); setErr("");
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [slot]);

  const submit = async (e) => {
    e.preventDefault();
    const v = vehicle.trim().toUpperCase();
    if (!v || v.length < 3) { setErr("Enter a valid vehicle number (min 3 chars)"); return; }
    setLoading(true);
    try {
      await onBook(slot.id, v);
    } catch (e) {
      setErr(e.response?.data?.message || "Booking failed. Slot may have been taken.");
      setLoading(false);
    }
  };

  if (!slot) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(17,24,39,0.50)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%", maxWidth: 420,
          border: "1px solid #E4E7EC",
          boxShadow: "0 20px 60px rgba(17,24,39,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          background: "#F7F8FA",
          borderBottom: "1px solid #E4E7EC",
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: "#6B7280", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>
              Assigning Slot
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 900, color: "#22C55E", letterSpacing: "-0.5px" }}>
              {slot.slotLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F4F5F7", border: "1px solid #E4E7EC",
              color: "#6B7280", cursor: "pointer",
              padding: "8px 10px", borderRadius: 10,
              fontSize: 16, lineHeight: 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.target.style.background = "#E4E7EC"}
            onMouseLeave={e => e.target.style.background = "#F4F5F7"}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          <form onSubmit={submit}>
            <label style={{
              display: "block",
              fontSize: 13, fontWeight: 700,
              color: "#374151",
              marginBottom: 8,
            }}>
              Vehicle Registration Number <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              ref={inputRef}
              value={vehicle}
              onChange={e => { setVehicle(e.target.value.toUpperCase()); setErr(""); }}
              placeholder="e.g. MH12AB1234"
              maxLength={20}
              disabled={loading}
              style={{
                width: "100%", padding: "14px 16px",
                borderRadius: 12,
                background: "#F7F8FA",
                border: `2px solid ${err ? "#EF4444" : "#E4E7EC"}`,
                color: "#111827",
                fontSize: 20, fontWeight: 700,
                letterSpacing: "0.06em",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                fontFamily: "monospace",
              }}
              onFocus={e => e.target.style.borderColor = "#22C55E"}
              onBlur={e => e.target.style.borderColor = err ? "#EF4444" : "#E4E7EC"}
            />

            {err && (
              <div style={{
                marginTop: 10, padding: "10px 14px",
                borderRadius: 10,
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 13, color: "#DC2626" }}>{err}</span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1, padding: "14px",
                  borderRadius: 12,
                  border: "1px solid #E4E7EC",
                  background: "#F7F8FA",
                  color: "#6B7280",
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.target.style.background = "#E4E7EC"}
                onMouseLeave={e => e.target.style.background = "#F7F8FA"}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !vehicle.trim()}
                style={{
                  flex: 2, padding: "14px",
                  borderRadius: 12, border: "none",
                  background: loading || !vehicle.trim() ? "#D1FAE5" : "#22C55E",
                  color: loading || !vehicle.trim() ? "#86EFAC" : "#fff",
                  fontSize: 15, fontWeight: 800,
                  cursor: loading || !vehicle.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background 0.15s",
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "#fff",
                      animation: "spin 0.6s linear infinite",
                    }} />
                    Booking…
                  </>
                ) : "✓ Confirm Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AttendantDashboard() {
  const { user } = useAuth();
  const { setNavInfo } = useAttendantNav();
  const [config, setConfig]       = useState(null);
  const [levelId, setLevelId]     = useState(null);
  const [levelData, setLevelData] = useState(null);
  const [slots, setSlots]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalSlot, setModalSlot] = useState(null);
  const [myPending, setMyPending] = useState(null);
  const [toast, setToast]         = useState(null);
  const [lastSync, setLastSync]   = useState(null);
  const pollRef = useRef(null);

  // ── publish parking info + live status up to the Navbar ─────────────────────
  useEffect(() => {
    setNavInfo({
      parkingName: config?.parking?.name || null,
      address:     config?.parking?.address || null,
      lastSync,
      isLive:      true,
    });
    // Clear when unmounting (navigating away)
    return () => setNavInfo(null);
  }, [config, lastSync, setNavInfo]);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── fetch slots ─────────────────────────────────────────────────────────────
  const fetchSlots = useCallback(async (lid) => {
    if (!lid) return;
    try {
      const r = await apiClient.get(`/parking/levels/${lid}/slots`);
      setLevelData(r.data.level);
      setSlots(r.data.slots || []);
      setLastSync(new Date());
    } catch {}
  }, []);

  // ── fetch config on mount ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await apiClient.get("/parking/attendant/config");
        if (!r.data.hasParking) { setLoading(false); return; }
        setConfig(r.data);
        const first = r.data.levels?.[0];
        if (first) { setLevelId(first.id); await fetchSlots(first.id); }
      } catch (e) { showToast("Failed to load config", false); }
      finally { setLoading(false); }
    })();
  }, [fetchSlots, showToast]);

  // ── polling ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!levelId) return;
    pollRef.current = setInterval(() => fetchSlots(levelId), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [levelId, fetchSlots]);

  // ── seat clicked → CLAIM atomically then open modal ──────────────────────────
  const handleSeatPress = useCallback(async (slot) => {
    if (slot.status !== "FREE") return;
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: "PENDING" } : s));
    setMyPending(slot.id);
    try {
      await apiClient.post(`/parking/slots/${slot.id}/claim`);
      setModalSlot(slot);
    } catch (err) {
      const msg = err.response?.data?.message || "Slot already taken.";
      showToast(msg, false);
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: err.response?.data?.currentStatus || "OCCUPIED" } : s));
      setMyPending(null);
    }
  }, [showToast]);

  // ── modal cancelled → UNCLAIM slot ──────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    if (modalSlot) {
      try { await apiClient.post(`/parking/slots/${modalSlot.id}/unclaim`); } catch {}
      setSlots(prev => prev.map(s => s.id === modalSlot.id ? { ...s, status: "FREE" } : s));
    }
    setModalSlot(null);
    setMyPending(null);
  }, [modalSlot]);

  // ── booking confirmed ────────────────────────────────────────────────────────
  const handleBook = useCallback(async (slotId, vehicleNumber) => {
    await apiClient.post(`/parking/slots/${slotId}/book`, { vehicleNumber });
    showToast(`✅ ${modalSlot?.slotLabel} booked for ${vehicleNumber}`);
    setModalSlot(null);
    setMyPending(null);
    await fetchSlots(levelId);
  }, [modalSlot, levelId, fetchSlots, showToast]);

  // ── release slot (right-click occupied) ─────────────────────────────────────
  const handleRelease = useCallback(async (slot) => {
    if (slot.status !== "OCCUPIED") return;
    if (!window.confirm(`Release slot ${slot.slotLabel}?\nVehicle: ${slot.vehicleNumber || "—"}`)) return;
    try {
      await apiClient.post(`/parking/slots/${slot.id}/release`);
      showToast(`${slot.slotLabel} released ✓`);
      fetchSlots(levelId);
    } catch { showToast("Failed to release", false); }
  }, [levelId, fetchSlots, showToast]);

  const onGridContextMenu = useCallback((e) => {
    const el = e.target.closest("[data-slotid]");
    if (!el) return;
    e.preventDefault();
    const s = slots.find(x => x.id === el.dataset.slotid);
    if (s) handleRelease(s);
  }, [slots, handleRelease]);

  // ── stats ────────────────────────────────────────────────────────────────────
  const stats = {
    total:    slots.length,
    free:     slots.filter(s => s.status === "FREE").length,
    occupied: slots.filter(s => s.status === "OCCUPIED").length,
    reserved: slots.filter(s => s.status === "RESERVED").length,
    pending:  slots.filter(s => s.status === "PENDING").length,
  };
  const pct = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "calc(100vh - 72px)", background: "#F7F8FA",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          border: "3px solid #E4E7EC", borderTopColor: "#22C55E",
          animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
        }} />
        <p style={{ color: "#6B7280", fontSize: 16, fontWeight: 500 }}>Loading parking data…</p>
      </div>
    </div>
  );

  // ─── No Parking Assigned ──────────────────────────────────────────────────
  if (!config) return (
    <div style={{
      minHeight: "calc(100vh - 72px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F7F8FA",
    }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🅿️</div>
        <p style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8 }}>No Parking Assigned</p>
        <p style={{ fontSize: 16, color: "#6B7280" }}>Ask your admin to assign a parking lot to your account.</p>
      </div>
    </div>
  );

  const levels = config.levels || [];

  return (
    <div style={{
      minHeight: "calc(100vh - 72px)",
      background: "#F7F8FA",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes sdot  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes toast { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 88, right: 20, zIndex: 9999,
          padding: "14px 22px", borderRadius: 14,
          fontSize: 15, fontWeight: 600,
          background: toast.ok ? "#F0FDF4" : "#FEF2F2",
          color: toast.ok ? "#15803D" : "#DC2626",
          border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}`,
          boxShadow: "0 8px 32px rgba(17,24,39,0.12)",
          animation: "toast 0.2s ease",
          maxWidth: 380,
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px 32px" }}>

        {/* ══════════════════════════════════════════════════
            STATS CARDS
        ══════════════════════════════════════════════════ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}>
          {[
            { label: "TOTAL",     val: stats.total,    accent: "#6B7280", bg: "#F7F8FA", border: "#E4E7EC" },
            { label: "AVAILABLE", val: stats.free,     accent: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
            { label: "OCCUPIED",  val: stats.occupied, accent: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
            { label: "RESERVED",  val: stats.reserved, accent: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
            { label: "PENDING",   val: stats.pending,  accent: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg,
              border: `1.5px solid ${s.border}`,
              borderRadius: 16,
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minHeight: 96,
              justifyContent: "center",
            }}>
              <span style={{
                fontSize: 36, fontWeight: 900,
                color: s.accent, lineHeight: 1,
                letterSpacing: "-1px",
              }}>{s.val}</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: s.accent,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                opacity: 0.85,
              }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            OCCUPANCY BAR
        ══════════════════════════════════════════════════ */}
        {stats.total > 0 && (
          <div style={{
            background: "#fff",
            border: "1px solid #E4E7EC",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", letterSpacing: "0.05em" }}>
                OCCUPANCY
              </span>
              <span style={{
                fontSize: 22, fontWeight: 900,
                color: pct > 80 ? "#EF4444" : pct > 50 ? "#F59E0B" : "#22C55E",
                letterSpacing: "-0.5px",
              }}>
                {pct}%
              </span>
            </div>
            <div style={{
              height: 14, background: "#F4F5F7",
              borderRadius: 99, overflow: "hidden",
              border: "1px solid #E4E7EC",
            }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${pct}%`,
                background: pct > 80 ? "#EF4444" : pct > 50 ? "#F59E0B" : "#22C55E",
                transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>{stats.occupied} occupied of {stats.total} total</span>
              <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>{stats.free} available</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            LEVEL TABS (multi-level only)
        ══════════════════════════════════════════════════ */}
        {levels.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {levels.map(lv => (
              <button
                key={lv.id}
                onClick={() => { setLevelId(lv.id); setSlots([]); fetchSlots(lv.id); }}
                style={{
                  padding: "10px 24px",
                  borderRadius: 999, border: "none",
                  cursor: "pointer", fontSize: 14, fontWeight: 700,
                  transition: "all 0.12s",
                  background: levelId === lv.id ? "#22C55E" : "#fff",
                  color: levelId === lv.id ? "#fff" : "#374151",
                  border: `1.5px solid ${levelId === lv.id ? "#22C55E" : "#E4E7EC"}`,
                  boxShadow: levelId === lv.id ? "0 2px 12px rgba(34,197,94,0.25)" : "none",
                }}
              >
                {lv.name}
              </button>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            PARKING GRID PANEL
        ══════════════════════════════════════════════════ */}
        <div style={{
          background: "#fff",
          border: "1px solid #E4E7EC",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 16px rgba(17,24,39,0.06)",
        }}>

          {/* Panel header */}
          <div style={{
            padding: "16px 24px",
            borderBottom: "1px solid #E4E7EC",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            background: "#F7F8FA",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
                {levelData?.levelName || "Parking Grid"}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6B7280" }}>
                Tap <span style={{ color: "#22C55E", fontWeight: 700 }}>green</span> to assign
                &nbsp;·&nbsp;
                Long-press / right-click <span style={{ color: "#EF4444", fontWeight: 700 }}>red</span> to release
              </p>
            </div>

            {/* Legend — horizontal */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {Object.entries(S).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: v.bg,
                    border: `2px solid ${v.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9,
                  }}>{v.icon}</div>
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Entry / Exit lane indicator */}
          <div style={{
            background: "#F7F8FA",
            borderBottom: "1px solid #E4E7EC",
            margin: "0",
            padding: "8px 24px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, transparent, #D1D5DB)" }} />
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 18px",
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: 999,
              fontSize: 12, fontWeight: 700, color: "#3B82F6",
              letterSpacing: "0.06em",
            }}>
              ▼&nbsp; ENTRY / EXIT &nbsp;▼
            </div>
            <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, #D1D5DB, transparent)" }} />
          </div>

          {/* THE GRID */}
          <div style={{ padding: "24px" }} onContextMenu={onGridContextMenu}>
            <GridWithContext
              slots={slots}
              levelData={levelData}
              onSeatPress={handleSeatPress}
              myPending={myPending}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            QUICK ACTIONS INFO
        ══════════════════════════════════════════════════ */}
        <div style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
        }}>
          {[
            { icon: "✓", color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0", title: "Green Slot", desc: "Tap to Assign" },
            { icon: "🚗", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", title: "Red Slot",   desc: "Long Press to Release" },
            { icon: "⏳", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", title: "Orange Slot", desc: "Waiting Confirmation" },
          ].map((a, i) => (
            <div key={i} style={{
              background: a.bg, border: `1px solid ${a.border}`,
              borderRadius: 12, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: a.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>{a.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{a.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>{a.desc}</p>
              </div>
            </div>
          ))}

          {/* Concurrency tip */}
          <div style={{
            background: "#F7F8FA", border: "1px solid #E4E7EC",
            borderRadius: 12, padding: "12px 16px",
            display: "flex", alignItems: "flex-start", gap: 10,
            gridColumn: "1 / -1",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
              <strong style={{ color: "#374151" }}>Concurrency:</strong> First attendant to tap wins the slot. Others see it orange (PENDING) immediately. &nbsp;
              <strong style={{ color: "#374151" }}>Sensor:</strong> ESP32 posts to{" "}
              <code style={{
                background: "#E4E7EC", padding: "1px 6px",
                borderRadius: 4, color: "#374151", fontSize: 11,
              }}>POST /api/sensor/update</code>
              {" "}— slot turns green automatically when car leaves.
            </p>
          </div>
        </div>

      </div>

      {/* ── Booking Modal ── */}
      {modalSlot && <BookModal slot={modalSlot} onClose={handleCancel} onBook={handleBook} />}
    </div>
  );
}
