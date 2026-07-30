import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { useAttendantNav } from "../state/AttendantNavContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const attendantNav = useAttendantNav();

  const isAttendant = location.pathname.startsWith("/attendant");
  const navInfo = isAttendant ? attendantNav?.navInfo : null;

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-0 h-[64px]">

        {/* ── LEFT: Logo + (on attendant) parking name ── */}
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white transition-transform duration-150 group-hover:scale-105">
              SP
            </div>
            {/* Hide brand text on attendant route — replaced by parking name */}
            {!isAttendant && (
              <div className="hidden sm:block">
                <p className="text-sm font-semibold tracking-tight text-neutral-900">Smart Parking</p>
                <p className="text-xs text-neutral-500">Attendant Portal</p>
              </div>
            )}
          </Link>

          {/* Parking lot name + address — only on attendant route */}
          {isAttendant && navInfo && (
            <>
              {/* Divider */}
              <div className="h-8 w-px bg-neutral-200 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest leading-none mb-0.5">
                  Attendant Portal
                </p>
                <p className="text-sm font-bold text-neutral-900 truncate leading-tight">
                  {navInfo.parkingName}
                </p>
                {navInfo.address && (
                  <p className="text-xs text-neutral-500 truncate leading-tight hidden sm:block">
                    📍 {navInfo.address}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Fallback brand text when on attendant route but config not loaded yet */}
          {isAttendant && !navInfo && (
            <>
              <div className="h-8 w-px bg-neutral-200 flex-shrink-0" />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold tracking-tight text-neutral-900">Smart Parking</p>
                <p className="text-xs text-neutral-500">Attendant Portal</p>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Live badge (attendant only) + user + logout ── */}
        <nav className="flex items-center gap-2 flex-shrink-0">

          {/* Live / Connected badge — attendant route only */}
          {isAttendant && navInfo?.isLive && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                color: "#15803D",
              }}
            >
              <span
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#22C55E",
                  display: "inline-block",
                  animation: "navPulse 1.5s infinite",
                }}
              />
              Connected
              {navInfo.lastSync && (
                <span style={{ color: "#9CA3AF", fontWeight: 400 }}>
                  · {navInfo.lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}

          {user && (
            <>
              {/* User avatar + name */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200">
                <div className="h-6 w-6 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <span className="text-sm font-medium text-neutral-700">{user.name || "Attendant"}</span>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-all duration-150"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}

          {!user && (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 transition-all duration-150"
            >
              Login
            </Link>
          )}
        </nav>
      </div>

      {/* Keyframe for the live pulse dot */}
      <style>{`@keyframes navPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </header>
  );
};

export default Navbar;
