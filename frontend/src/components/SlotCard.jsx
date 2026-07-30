import React from "react";

const statusStyles = {
  FREE: "bg-emerald-500/10 border-emerald-500/70 text-emerald-300",
  OCCUPIED: "bg-red-500/10 border-red-500/70 text-red-300",
  RESERVED: "bg-sky-500/10 border-sky-500/70 text-sky-300"
};

const statusLabel = {
  FREE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved"
};

const SlotCard = ({ slot, onOverride, showOverride }) => {
  const status = slot.status || "FREE";
  const style = statusStyles[status] || statusStyles.FREE;

  return (
    <div className={`card flex flex-col gap-2 p-3 text-xs ${style}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Slot {slot.slotNumber}</p>
        <span className="rounded-full bg-slate-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wide">
          {statusLabel[status]}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-300">
        <span>Sensor: {slot.sensorId}</span>
        <span className="text-slate-400">
          {slot.lastUpdated ? new Date(slot.lastUpdated).toLocaleTimeString() : "-"}
        </span>
      </div>
      {showOverride && (
        <div className="mt-1 flex gap-1">
          <button
            onClick={() => onOverride(slot, "FREE")}
            className="flex-1 rounded-md bg-emerald-500/90 py-1 text-[11px] font-medium text-emerald-50 hover:bg-emerald-500"
          >
            Set Free
          </button>
          <button
            onClick={() => onOverride(slot, "OCCUPIED")}
            className="flex-1 rounded-md bg-red-500/90 py-1 text-[11px] font-medium text-red-50 hover:bg-red-500"
          >
            Occupied
          </button>
        </div>
      )}
    </div>
  );
};

export default SlotCard;

