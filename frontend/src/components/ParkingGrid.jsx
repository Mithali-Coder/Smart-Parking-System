import React, { useMemo } from "react";

/**
 * BookMyShow-style Parking Grid
 * - Actual cinema-seat-grid look: fixed-size square tiles in uniform rows
 * - Color-coded with glow effects
 * - Aisle gap in the middle of each row
 * - Row labels on left, column numbers on bottom
 * - Compact, proportional, visually clear
 */

const STATUS_CONFIG = {
  FREE: {
    bg: "#16a34a",
    border: "#15803d",
    text: "#ffffff",
    hover: "#15803d",
    shadow: "0 0 8px rgba(22,163,74,0.5)",
    cursor: "pointer",
    label: "Available",
  },
  OCCUPIED: {
    bg: "#dc2626",
    border: "#b91c1c",
    text: "#ffffff",
    hover: null,
    shadow: "none",
    cursor: "default",
    label: "Occupied",
  },
  RESERVED: {
    bg: "#2563eb",
    border: "#1d4ed8",
    text: "#ffffff",
    hover: null,
    shadow: "none",
    cursor: "default",
    label: "Reserved",
  },
  BLOCKED: {
    bg: "#374151",
    border: "#374151",
    text: "#6b7280",
    hover: null,
    shadow: "none",
    cursor: "not-allowed",
    label: "Blocked",
  },
};

const TILE_SIZE = 38;
const GAP = 4;
const AISLE_AFTER = null; // auto-detect middle

const SlotTile = ({ slot, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  const cfg = STATUS_CONFIG[slot?.status] || STATUS_CONFIG.BLOCKED;
  const empty = !slot || slot._isEmpty;

  if (empty) {
    return <div style={{ width: TILE_SIZE, height: TILE_SIZE, flexShrink: 0 }} />;
  }

  const label = slot.slotLabel || "";
  const vehicle = slot.status === "OCCUPIED" && slot.vehicleNumber
    ? slot.vehicleNumber.slice(-4)
    : null;

  const isClickable = slot.status === "FREE";

  return (
    <div
      onClick={isClickable ? () => onClick(slot) : undefined}
      onMouseEnter={() => isClickable && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={
        slot.status === "OCCUPIED" && slot.vehicleNumber
          ? `${label} · ${slot.vehicleNumber}`
          : `${label} · ${cfg.label}`
      }
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        flexShrink: 0,
        borderRadius: 6,
        background: hovered && cfg.hover ? cfg.hover : cfg.bg,
        border: `2px solid ${cfg.border}`,
        cursor: cfg.cursor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.12s ease",
        boxShadow: hovered && isClickable ? cfg.shadow : "none",
        transform: hovered && isClickable ? "scale(1.08)" : "scale(1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Type badge for special slots */}
      {slot.slotType === "DISABLED" && (
        <div style={{ position: "absolute", top: 1, right: 2, fontSize: 8 }}>♿</div>
      )}
      {slot.slotType === "PREMIUM" && (
        <div style={{ position: "absolute", top: 1, right: 2, fontSize: 8 }}>★</div>
      )}

      {vehicle ? (
        <>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}>{label}</span>
          <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>{vehicle}</span>
        </>
      ) : (
        <span style={{ fontSize: 10, color: cfg.text, fontWeight: 700, lineHeight: 1 }}>{label}</span>
      )}
    </div>
  );
};

const Legend = () => (
  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
    {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
      <div key={status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 16, height: 16, borderRadius: 4,
          background: cfg.bg, border: `2px solid ${cfg.border}`,
        }} />
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{cfg.label}</span>
      </div>
    ))}
  </div>
);

const ParkingGrid = ({ level, slots, onSlotClick }) => {
  const { grid, rowLabels, columnCount } = useMemo(() => {
    if (!level || !slots || slots.length === 0) {
      return { grid: [], rowLabels: [], columnCount: 0 };
    }

    const rowCount = Array.isArray(level.rows) ? level.rows.length : (level.rows || 0);
    const cols = level.columns || 0;
    const labels = Array.isArray(level.rows)
      ? level.rows
      : Array.from({ length: rowCount }, (_, i) => String.fromCharCode(65 + i));

    // Build 2D grid
    const gridArray = Array.from({ length: rowCount }, () => Array(cols).fill(null));
    slots.forEach(slot => {
      if (
        slot.rowIndex >= 0 && slot.rowIndex < rowCount &&
        slot.columnIndex >= 0 && slot.columnIndex < cols
      ) {
        gridArray[slot.rowIndex][slot.columnIndex] = slot;
      }
    });

    return { grid: gridArray, rowLabels: labels, columnCount: cols };
  }, [level, slots]);

  if (!level) {
    return (
      <div style={{ textAlign: "center", color: "#9ca3af", padding: "48px 0" }}>
        <p style={{ fontSize: 14 }}>Select a level to view parking slots</p>
      </div>
    );
  }

  if (grid.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#9ca3af", padding: "48px 0" }}>
        <p style={{ fontSize: 14 }}>No slots configured for this level</p>
      </div>
    );
  }

  // Aisle position: after middle column
  const aisleAfter = Math.floor(columnCount / 2) - 1;

  return (
    <div>
      <Legend />

      {/* Entry Arrow */}
      <div style={{
        textAlign: "center", marginBottom: 12,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6
      }}>
        <div style={{
          height: 1, flex: 1, maxWidth: 100,
          background: "linear-gradient(90deg, transparent, #d1d5db)"
        }} />
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em" }}>
          ▼ ENTRY POINT
        </span>
        <div style={{
          height: 1, flex: 1, maxWidth: 100,
          background: "linear-gradient(90deg, #d1d5db, transparent)"
        }} />
      </div>

      {/* Scrollable grid container */}
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div style={{ display: "inline-block", minWidth: "fit-content" }}>

          {/* Rows */}
          {grid.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "flex",
                alignItems: "center",
                gap: GAP,
                marginBottom: GAP,
              }}
            >
              {/* Row Label */}
              <div style={{
                width: 24, flexShrink: 0,
                fontSize: 13, fontWeight: 700,
                color: "#374151", textAlign: "right",
                marginRight: 6,
              }}>
                {rowLabels[rowIndex] || String.fromCharCode(65 + rowIndex)}
              </div>

              {/* Slots with aisle gap */}
              {row.map((slot, colIndex) => (
                <React.Fragment key={colIndex}>
                  <SlotTile
                    slot={slot || { _isEmpty: false, status: "BLOCKED", slotLabel: "", rowIndex, columnIndex: colIndex }}
                    onClick={onSlotClick}
                  />
                  {/* Aisle gap */}
                  {colIndex === aisleAfter && (
                    <div style={{
                      width: 20, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{
                        width: 2, height: TILE_SIZE,
                        background: "repeating-linear-gradient(to bottom, #e5e7eb 0px, #e5e7eb 4px, transparent 4px, transparent 8px)",
                        borderRadius: 2,
                      }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}

          {/* Column Numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: GAP, marginTop: 6 }}>
            {/* Spacer for row label */}
            <div style={{ width: 30, flexShrink: 0 }} />
            {Array.from({ length: columnCount }, (_, i) => (
              <React.Fragment key={i}>
                <div style={{
                  width: TILE_SIZE, flexShrink: 0,
                  textAlign: "center",
                  fontSize: 10, fontWeight: 600,
                  color: "#9ca3af",
                }}>
                  {level.columnLabels?.[i] || String(i + 1).padStart(2, "0")}
                </div>
                {i === aisleAfter && <div style={{ width: 20, flexShrink: 0 }} />}
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ParkingGrid;
