import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertTriangle
} from "lucide-react";

// For development: Use Vite proxy
// For production: Use full URL
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? ""  // Vite proxy handles /api
  : (import.meta.env.VITE_API_URL || "http://192.168.1.101:5000");

const ESP32Monitor = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchSensors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sensor/slots`);
      
      // Group by sensorId and get unique sensors
      const sensorMap = new Map();
      
      response.data.slots.forEach(slot => {
        if (slot.sensorId) {
          const existing = sensorMap.get(slot.sensorId);
          if (!existing || new Date(slot.lastUpdated) > new Date(existing.lastUpdated)) {
            sensorMap.set(slot.sensorId, {
              sensorId: slot.sensorId,
              slotId: slot.slotId,
              slotLabel: slot.slotLabel,
              status: slot.status,
              connected: slot.sensorConnected,
              lastUpdated: slot.lastUpdated,
              detectionCount: slot.detectionCount || 0,
              totalReadings: slot.totalReadings || 0,
              lastDetectionTime: slot.lastDetectionTime,
              parking: slot.parkingId?.name || "N/A",
              level: slot.levelId?.name || "N/A"
            });
          }
        }
      });

      setSensors(Array.from(sensorMap.values()));
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, 3000); // Auto-refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const getTimeSinceUpdate = (lastUpdated) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMs = now - updated;
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ago`;
  };

  const getConnectionStatus = (connected, lastUpdated) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMs = now - updated;
    const diffSec = Math.floor(diffMs / 1000);

    if (connected && diffSec < 30) {
      return { status: "online", label: "Online", color: "green" };
    } else if (diffSec < 60) {
      return { status: "warning", label: "Unstable", color: "yellow" };
    } else {
      return { status: "offline", label: "Offline", color: "red" };
    }
  };

  const stats = {
    total: sensors.length,
    online: sensors.filter(s => {
      const conn = getConnectionStatus(s.connected, s.lastUpdated);
      return conn.status === "online";
    }).length,
    offline: sensors.filter(s => {
      const conn = getConnectionStatus(s.connected, s.lastUpdated);
      return conn.status === "offline";
    }).length,
    warning: sensors.filter(s => {
      const conn = getConnectionStatus(s.connected, s.lastUpdated);
      return conn.status === "warning";
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          <p className="text-gray-400">Loading ESP32 sensors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">ESP32 Monitor</h1>
          <p className="text-gray-400 text-sm">
            Real-time ESP32 sensor connectivity status
          </p>
        </div>
        <button
          onClick={fetchSensors}
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
        {/* Total Sensors */}
        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: "rgba(139,92,246,0.08)", 
            border: "1px solid rgba(139,92,246,0.2)" 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total ESP32</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Zap className="w-8 h-8 text-violet-400" />
          </div>
        </div>

        {/* Online */}
        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: "rgba(34,197,94,0.08)", 
            border: "1px solid rgba(34,197,94,0.2)" 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Online</p>
              <p className="text-2xl font-bold text-green-400">{stats.online}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        {/* Warning */}
        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: "rgba(234,179,8,0.08)", 
            border: "1px solid rgba(234,179,8,0.2)" 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Unstable</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.warning}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        {/* Offline */}
        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: "rgba(239,68,68,0.08)", 
            border: "1px solid rgba(239,68,68,0.2)" 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Offline</p>
              <p className="text-2xl font-bold text-red-400">{stats.offline}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator */}
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

      {/* Sensors Grid */}
      {sensors.length === 0 ? (
        <div 
          className="text-center py-16 rounded-xl"
          style={{ 
            background: "rgba(255,255,255,0.02)", 
            border: "1px solid rgba(139,92,246,0.15)" 
          }}
        >
          <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No ESP32 Sensors Found</p>
          <p className="text-gray-500 text-sm">
            Map sensorId to slots in MongoDB to see ESP32 devices here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => {
            const connectionStatus = getConnectionStatus(sensor.connected, sensor.lastUpdated);
            const timeSince = getTimeSinceUpdate(sensor.lastUpdated);

            return (
              <div
                key={sensor.sensorId}
                className="p-5 rounded-xl transition-all hover:scale-105"
                style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  border: `2px solid ${
                    connectionStatus.status === "online" 
                      ? "rgba(34,197,94,0.3)" 
                      : connectionStatus.status === "warning"
                      ? "rgba(234,179,8,0.3)"
                      : "rgba(239,68,68,0.3)"
                  }` 
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ 
                        background: connectionStatus.status === "online"
                          ? "rgba(34,197,94,0.15)"
                          : connectionStatus.status === "warning"
                          ? "rgba(234,179,8,0.15)"
                          : "rgba(239,68,68,0.15)"
                      }}
                    >
                      {connectionStatus.status === "online" ? (
                        <Wifi className="w-6 h-6 text-green-400" />
                      ) : (
                        <WifiOff className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{sensor.sensorId}</p>
                      <p className="text-gray-400 text-xs">ESP32 Sensor</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div 
                    className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                    style={{ 
                      background: connectionStatus.status === "online"
                        ? "rgba(34,197,94,0.15)"
                        : connectionStatus.status === "warning"
                        ? "rgba(234,179,8,0.15)"
                        : "rgba(239,68,68,0.15)",
                      color: connectionStatus.status === "online"
                        ? "#4ade80"
                        : connectionStatus.status === "warning"
                        ? "#facc15"
                        : "#f87171",
                      border: `1px solid ${
                        connectionStatus.status === "online"
                          ? "rgba(34,197,94,0.3)"
                          : connectionStatus.status === "warning"
                          ? "rgba(234,179,8,0.3)"
                          : "rgba(239,68,68,0.3)"
                      }`
                    }}
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ 
                        background: connectionStatus.status === "online"
                          ? "#4ade80"
                          : connectionStatus.status === "warning"
                          ? "#facc15"
                          : "#f87171"
                      }}
                    />
                    {connectionStatus.label}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {/* Slot Info */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Assigned Slot:</span>
                    <span className="text-white font-medium">{sensor.slotLabel || sensor.slotId}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Location:</span>
                    <span className="text-white text-sm">{sensor.parking}</span>
                  </div>

                  {/* Level */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Level:</span>
                    <span className="text-white text-sm">{sensor.level}</span>
                  </div>

                  {/* Current Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Slot Status:</span>
                    <span 
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ 
                        background: sensor.status === "OCCUPIED" || sensor.status === "booked"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(34,197,94,0.15)",
                        color: sensor.status === "OCCUPIED" || sensor.status === "booked"
                          ? "#f87171"
                          : "#4ade80"
                      }}
                    >
                      {sensor.status?.toUpperCase()}
                    </span>
                  </div>

                  {/* Detection Count */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Detections:</span>
                    <span className="text-violet-400 font-bold text-lg">{sensor.detectionCount}</span>
                  </div>

                  {/* Total Readings */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total Readings:</span>
                    <span className="text-gray-300 text-sm">{sensor.totalReadings}</span>
                  </div>

                  {/* Last Detection Time */}
                  {sensor.lastDetectionTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Last Detection:</span>
                      <span className="text-gray-300 text-xs">
                        {new Date(sensor.lastDetectionTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {/* Last Update */}
                  <div 
                    className="flex items-center gap-2 pt-3 mt-3"
                    style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}
                  >
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400 text-xs">Last update: {timeSince}</span>
                  </div>

                  {/* Activity Indicator */}
                  {connectionStatus.status === "online" && (
                    <div className="flex items-center gap-2 text-green-400 text-xs">
                      <Activity className="w-4 h-4 animate-pulse" />
                      <span>Sending data...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <div 
        className="p-4 rounded-xl"
        style={{ 
          background: "rgba(59,130,246,0.08)", 
          border: "1px solid rgba(59,130,246,0.2)" 
        }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(59,130,246,0.15)" }}
          >
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">How to add ESP32 sensors?</p>
            <p className="text-gray-400 text-sm mb-2">
              1. Upload Arduino code to ESP32 with unique sensorId<br />
              2. Map sensorId to a slot in MongoDB<br />
              3. ESP32 will appear here automatically when it sends first update
            </p>
            <p className="text-blue-400 text-xs">
              Status: Online (&lt;30s) • Unstable (30-60s) • Offline (&gt;60s)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESP32Monitor;
