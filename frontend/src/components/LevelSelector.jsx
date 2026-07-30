import React from "react";

/**
 * Premium Level Selector - Apple/Linear inspired
 * - Clean card-based selection
 * - Minimal active state (border only)
 * - Clear typography hierarchy
 */
const LevelSelector = ({ levels, onSelectLevel, selectedLevelId }) => {
  if (!levels || levels.length === 0) {
    return null;
  }

  // If only one level, auto-select it
  React.useEffect(() => {
    if (levels.length === 1 && !selectedLevelId) {
      onSelectLevel(levels[0].id);
    }
  }, [levels, selectedLevelId, onSelectLevel]);

  if (levels.length === 1) {
    return null; // Skip level selection for single level
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-neutral-900 mb-1">
          Select Parking Level
        </h3>
        <p className="text-sm text-neutral-500">
          Choose a level to view and manage parking slots
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelectLevel(level.id)}
            className={`
              p-4 rounded-premium border-2 transition-all duration-150 ease-apple
              ${
                selectedLevelId === level.id
                  ? "border-neutral-900 bg-neutral-50 shadow-soft"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-soft"
              }
            `}
          >
            <div className="text-center">
              <div className="text-2xl font-semibold text-neutral-900 mb-1">
                {level.levelNumber}
              </div>
              <div className="text-xs font-medium text-neutral-600">
                {level.levelName}
              </div>
              <div className="text-xs text-neutral-400 mt-1.5">
                {level.rows} × {level.columns} slots
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LevelSelector;
