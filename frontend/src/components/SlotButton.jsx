import React from "react";

/**
 * Premium Parking Slot Tile - BookMyShow + Apple inspired
 * - Looks like physical parking tiles, not buttons
 * - White cards with thin borders
 * - Status indicated by border color + subtle dot/tag
 * - Minimal hover: soft shadow + pointer
 * - Selected/Booked: slightly tinted background (5-8% opacity)
 * - Clear text hierarchy: Slot ID prominent, vehicle number muted
 */
const SlotButton = ({ slot, onClick, isSelected = false }) => {
  const getSlotStyles = () => {
    // Base: white card with border, feels like a physical tile
    const baseStyles = "relative w-full h-10 rounded-premium border-2 transition-all duration-150 ease-apple flex flex-col items-center justify-center text-xs font-medium";
    
    switch (slot.status) {
      case "FREE":
        // Available: green border, white bg, hover shadow
        return `${baseStyles} border-green-500 bg-white text-green-700 cursor-pointer hover:shadow-soft-md hover:border-green-600 active:scale-[0.98]`;
        
      case "OCCUPIED":
        // Booked: amber fill with subtle tint
        return `${baseStyles} border-amber-500 bg-amber-50 text-amber-900 cursor-default`;
        
      case "RESERVED":
        // Reserved: blue fill with subtle tint
        return `${baseStyles} border-blue-500 bg-blue-50 text-blue-900 cursor-default`;
        
      case "BLOCKED":
        // Blocked: gray, disabled look
        return `${baseStyles} border-neutral-300 bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-60`;
        
      default:
        return `${baseStyles} border-neutral-300 bg-neutral-50 text-neutral-500 cursor-not-allowed`;
    }
  };

  const getStatusIndicator = () => {
    // Small corner dot for status (Apple style)
    switch (slot.status) {
      case "FREE":
        return <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500"></div>;
      case "OCCUPIED":
        return <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500"></div>;
      case "RESERVED":
        return <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500"></div>;
      case "BLOCKED":
        return (
          <div className="absolute top-1 right-1 text-neutral-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getSlotTypeIcon = () => {
    // Minimal icons for special slot types
    switch (slot.slotType) {
      case "DISABLED":
        return <span className="text-[10px]">♿</span>;
      case "PREMIUM":
        return <span className="text-[10px]">⭐</span>;
      case "BIKE":
        return <span className="text-[10px]">🏍️</span>;
      default:
        return null;
    }
  };

  const isClickable = slot.status === "FREE";
  const slotLabel = slot.slotLabel || "";
  const showVehicleNumber = slot.status === "OCCUPIED" && slot.vehicleNumber;

  // Non-clickable slots (blocked, occupied, reserved)
  if (!isClickable) {
    return (
      <div
        className={getSlotStyles()}
        title={showVehicleNumber
          ? `Vehicle: ${slot.vehicleNumber}`
          : slotLabel || "Unavailable"}
      >
        {getStatusIndicator()}
        <div className="text-center px-1 w-full">
          {showVehicleNumber ? (
            // Show vehicle number for occupied slots
            <>
              <div className="text-[11px] font-semibold leading-tight truncate">{slot.vehicleNumber}</div>
              <div className="text-[9px] text-neutral-500 leading-tight">{slotLabel}</div>
            </>
          ) : (
            // Show slot label for other statuses
            <>
              <div className="text-[11px] font-semibold leading-tight">{slotLabel}</div>
              {getSlotTypeIcon()}
            </>
          )}
        </div>
      </div>
    );
  }

  // Clickable slots (available)
  return (
    <button
      onClick={() => onClick(slot)}
      className={getSlotStyles()}
      title={`${slotLabel} - Click to book`}
    >
      {getStatusIndicator()}
      <div className="text-center px-1">
        <div className="text-[11px] font-semibold leading-tight">{slotLabel}</div>
        {getSlotTypeIcon()}
      </div>
    </button>
  );
};

export default SlotButton;
