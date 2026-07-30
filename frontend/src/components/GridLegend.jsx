import React from "react";

/**
 * Premium Legend - Segmented pill-style indicators
 * - Minimal color accents (border/dot only)
 * - No filled backgrounds
 * - Clean, horizontal layout
 * - Apple/Linear inspired
 */
const GridLegend = () => {
  const legendItems = [
    {
      label: "Available",
      indicator: <div className="w-4 h-4 rounded border-2 border-green-500 bg-white"></div>
    },
    {
      label: "Booked",
      indicator: <div className="w-4 h-4 rounded bg-amber-400 border-2 border-amber-500"></div>
    },
    {
      label: "Reserved",
      indicator: <div className="w-4 h-4 rounded flex items-center justify-center bg-blue-500 border-2 border-blue-600">
        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
      </div>
    },
    {
      label: "Blocked",
      indicator: <div className="w-4 h-4 rounded bg-neutral-300 border-2 border-neutral-400"></div>
    }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-3 px-4 bg-neutral-50 rounded-premium border border-neutral-200">
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.indicator}
          <span className="text-xs font-medium text-neutral-700">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default GridLegend;
