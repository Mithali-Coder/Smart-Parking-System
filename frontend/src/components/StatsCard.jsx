import React from "react";

/**
 * Premium KPI Card - Apple/Linear inspired
 * - White card on light gray canvas
 * - Clear hierarchy: label → number
 * - Subtle hover elevation
 * - No colored backgrounds, minimal icons
 */
const StatsCard = ({ label, value, accent, icon }) => {
  return (
    <div className="card-hover p-5">
      {/* Small label - uppercase, muted */}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
        {label}
      </p>
      
      {/* Large number - prominent */}
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-semibold text-neutral-900 tracking-tight">
          {value}
        </p>
        {accent && (
          <span className="text-sm font-normal text-neutral-400">{accent}</span>
        )}
      </div>
      
      {/* Optional subtle icon indicator */}
      {icon && (
        <div className="mt-3 text-neutral-400">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatsCard;

