import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Circle,
  Zap,
  X
} from "lucide-react";

// For development: Use Vite proxy
// For production: Use full URL
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? ""  // Vite proxy handles /api
  : (import.meta.env.VITE_API_URL || "http://10.150.38.70:5000");

// Notification Component
const SensorNotification = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
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
      className="fixed top-20 right-6 z-50 min-w-[320px] max-w-[400px] animate-slide-in"
      style={{
        animation: "slideIn 0.3s ease-out"
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
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`
            }}
          >
            {getIcon()}
          </div>

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

          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div
          className="mt-3 h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <div
            className="h-full"
            style={{ 
              background: colors.text,
              animation: "progress 5s linear"
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
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
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

const ConfigModule = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [simulateLoading, setSimulateLoading] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [previousSlots, setPreviousSlots] = useState({});

  const fetchSlots = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sensor/slots`);
      const newSlots = response.data.slots;
      
      // Check for status changes and create notifications
      newSlots.forEach(slot => {
        const prevSlot = previousSlots[slot.slotId];
        
        if (prevSlot) {
          // Check if status changed
          if (prevSlot.status !== slot.status) {
            const notification = {
              id: Date.now() + Math.random(),
              sensorId: slot.sensorId || "Unknown",
              slotLabel: slot.slotLabel || slot.slotId,
              type: slot.status === "OCCUPIED" || slot.status === "booked" ? "occupied" : "free",
              title: slot.status === "OCCUPIED" || slot.status === "booked" 
                ? "🚗 Object Detected!" 
                : "✅ Slot Available",
              message: slot.status === "OCCUPIED" || slot.status === "booked"
                ? `Ultrasonic sensor detected an object in slot ${slot.slotLabel || slot.slotId}`
                : `Slot ${slot.slotLabel || slot.slotId} is now free`
            };
            
            setNotifications(prev => [...prev, notification]);
          }
          
          // Check if sensor just connected
          if (!prevSlot.sensorConnected && slot.sensorConnected) {
            const notification = {
              id: Date.now() + Math.random(),
              sensorId: slot.sensorId || "Unknown",
              slotLabel: slot.slotLabel || slot.slotId,
              type: "connected",
              title: "📡 Sensor Connected",
              message: `ESP32 sensor for slot ${slot.slotLabel || slot.slotId} is now online`
            };
            
            setNotifications(prev => [...prev, notification]);
          }
        }
      });
      
      // Update slots and previous state
      setSlots(newSlots);
      const slotsMap = {};
      newSlots.forEach(slot => {
        slotsMap[slot.slotId] = slot;
      });
      setPreviousSlots(slotsMap);
      
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch slots");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (slotId, status) => {
    setSimulateLoading(`${slotId}-${status}`);
    try {
      await axios.post(`${API_BASE_URL}/api/sensor/simulate`, {
        slotId,
        status
      });
      await fetchSlots();
    } catch (err) {
      console.error("Simulate error:", err);
      alert(err.response?.data?.message || "Simulation failed");
    } finally {
      setSimulateLoading(null);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case "FREE":
      case "AVAILABLE":
        return "bg-green-500";
      case "OCCUPIED":
      case "BOOKED":
        return "bg-red-500";
      case "RESERVED":
      case "PENDING":
        return "bg-blue-500";
      case "BLOCKED":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusTextColor = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case "FREE":
      case "AVAILABLE":
        return "text-green-400";
      case "OCCUPIED":
      case "BOOKED":
        return "text-red-400";
      case "RESERVED":
      case "PENDING":
        return "text-blue-400";
      case "BLOCKED":
        return "text-gray-400";
      default:
        return "text-yellow-400";
    }
  };

  const stats = {
    total: slots.length,
    connected: slots.filter(s => s.sensorConnected).length,
    free: slots.filter(s => ["FREE", "available"].includes(s.status)).length,
    occupied: slots.filter(s => ["OCCUPIED", "booked"].includes(s.status)).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-gray-400">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="fixed top-20 right-6 z-50 space-y-3">
        {notifications.map((notification) => (
          <SensorNotification
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">IoT Config Module</h1>
          <p className="text-gray-400 text-sm">
            Real-time sensor monitoring and configuration
          </p>
        </div>
        <button
          onClick={fetchSlots}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          style={{ 
            background: "rgba(139,92,246,0.1)", 
            border: "1px solid rgba(139,92,246,0.3)",
            color: "#a78bfa"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(139,92,246,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(139,92,246,0.1)"}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: "rgba(139,92,246,0.08)", 
            border: "1px solid rgba(139,92,246,0.2)" 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Slots</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Activity className="w-8 h-8 text-violet-400" />
          </div>
        </div>

        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: "rgba(34,197,94,0.08)", 
            border: "1px solid rgba(34,197,94,0.2)" 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Sensors Connected</p>
              <p className="text-2xl font-bold text-green-400">{stats.connected}</p>
            </div>
            <Wifi className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: "rgba(34,197,94,0.08)", 
            border: "1px solid rgba(34,197,94,0.2)" 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Free Slots</p>
              <p className="text-2xl font-bold text-green-400">{stats.free}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: "rgba(239,68,68,0.08)", 
            border: "1px solid rgba(239,68,68,0.2)" 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Occupied Slots</p>
              <p className="text-2xl font-bold text-red-400">{stats.occupied}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Last Update Info */}
      <div 
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
        style={{ 
          background: "rgba(139,92,246,0.05)", 
          border: "1px solid rgba(139,92,246,0.15)" 
        }}
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-gray-400">
          Auto-refreshing every 3 seconds • Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      {error && (
        <div 
          className="flex items-center gap-3 p-4 rounded-lg"
          style={{ 
            background: "rgba(239,68,68,0.1)", 
            border: "1px solid rgba(239,68,68,0.3)" 
          }}
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Slots Table */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ 
          background: "rgba(255,255,255,0.02)", 
          border: "1px solid rgba(139,92,246,0.15)" 
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(139,92,246,0.08)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Slot ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Parking / Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Sensor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Simulate
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, index) => (
                <tr 
                  key={slot._id}
                  style={{ 
                    borderTop: index > 0 ? "1px solid rgba(139,92,246,0.1)" : "none" 
                  }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Circle className={`w-2 h-2 ${getStatusColor(slot.status)}`} />
                      <span className="text-white font-medium">
                        {slot.slotLabel || slot.slotId}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="text-gray-300">{slot.parkingId?.name || "N/A"}</p>
                      <p className="text-gray-500 text-xs">{slot.levelId?.name || "N/A"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusTextColor(slot.status)}`}
                      style={{ 
                        background: `${getStatusColor(slot.status)}20`,
                        border: `1px solid ${getStatusColor(slot.status)}40`
                      }}
                    >
                      {slot.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {slot.sensorConnected ? (
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <WifiOff className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-medium">Disconnected</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      {new Date(slot.lastUpdated).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSimulate(slot.slotId, "OCCUPIED")}
                        disabled={simulateLoading === `${slot.slotId}-OCCUPIED`}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                        style={{ 
                          background: "rgba(239,68,68,0.1)", 
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#f87171"
                        }}
                        onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                      >
                        {simulateLoading === `${slot.slotId}-OCCUPIED` ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          "Occupied"
                        )}
                      </button>
                      <button
                        onClick={() => handleSimulate(slot.slotId, "FREE")}
                        disabled={simulateLoading === `${slot.slotId}-FREE`}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                        style={{ 
                          background: "rgba(34,197,94,0.1)", 
                          border: "1px solid rgba(34,197,94,0.3)",
                          color: "#4ade80"
                        }}
                        onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = "rgba(34,197,94,0.2)")}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(34,197,94,0.1)"}
                      >
                        {simulateLoading === `${slot.slotId}-FREE` ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          "Free"
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {slots.length === 0 && !loading && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No slots found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigModule;
