import React from "react";
import SlotCard from "./SlotCard.jsx";

const SlotGrid = ({ slots, showOverride = false, onOverride }) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {slots.map((slot) => (
        <SlotCard
          key={slot._id || slot.slotNumber}
          slot={slot}
          showOverride={showOverride}
          onOverride={onOverride}
        />
      ))}
    </div>
  );
};

export default SlotGrid;

