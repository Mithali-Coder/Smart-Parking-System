import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Wifi, X } from "lucide-react";

const SensorNotification = ({ notification, onClose }) => {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case "occupied":
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case "free":
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case "connected":
        return <Wifi className="w-6 h-6 text-blue-400" />;
      default:
        return <Wifi className="w-6 h-6 text-gray-400" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case "occupied":
        return {
          bg: "rgba(239,68,68,0.15)",
          border: "rgba(239,68,68,0.4)",
          text: "#f87171"
        };
      case "free":
        return {
          bg: "rgba(34,197,94,0.15)",
          border: "rgba(34,197,94,0.4)",
          text: "#4ade80"
        };
      case "connected":
        return {
          bg: "rgba(59,130,246,0.15)",
          border: "rgba(59,130,246,0.4)",
          text: "#60a5fa"
        };
      default:
        return {
          bg: "rgba(107,114,128,0.15)",
          border: "rgba(107,114,128,0.4)",
          text: "#9ca3af"
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className="fixed top-20 right-6 z-50 animate-slide-in-right"
      style={{
        minWidth: "320px",
        maxWidth: "400px"
      }}
    >
      <div
        className="rounded-xl p-4 shadow-2xl backdrop-blur-sm"
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          boxShadow: `0 8px 32px ${colors.border}`
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`
            }}
          >
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4
              className="font-bold text-sm mb-1"
              style={{ color: colors.text }}
            >
              {notification.title}
            </h4>
            <p className="text-gray-300 text-xs mb-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Sensor: {notification.sensorId}</span>
              <span>•</span>
              <span>Slot: {notification.slotLabel}</span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="mt-3 h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <div
            className="h-full animate-progress"
            style={{ background: colors.text }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-progress {
          animation: progress 5s linear;
        }
      `}</style>
    </div>
  );
};

export default SensorNotification;
