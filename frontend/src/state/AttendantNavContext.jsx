import React, { createContext, useContext, useState } from "react";

/**
 * Lightweight context that lets AttendantDashboard publish its
 * parking info + live-status up to the shared Navbar.
 * No business logic lives here — it's purely a display bridge.
 */
const AttendantNavContext = createContext(null);

export const AttendantNavProvider = ({ children }) => {
  const [navInfo, setNavInfo] = useState(null);
  // navInfo shape: { parkingName, address, lastSync, isLive }

  return (
    <AttendantNavContext.Provider value={{ navInfo, setNavInfo }}>
      {children}
    </AttendantNavContext.Provider>
  );
};

export const useAttendantNav = () => useContext(AttendantNavContext);
