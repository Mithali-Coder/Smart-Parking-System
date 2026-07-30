import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Activity, Wifi, Car, CheckCircle, AlertCircle, Clock } from "lucide-react";

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? "" : (import.meta.env.VITE_API_URL || "http://10.150.38.70:5000");

const ESP32ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [sensorStatus, setSensorStatus] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const logEndRef = useRef(null);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSensorData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/sensor/slots`);
      const slots = response.data.slots;

      // Find slots with sensors
      slots.forEach(slot => {
        if (slot.sensorId) {
          const prevStatus = sensorStatus[slot.sensorId];
          const currentStatus = slot.status;
          const currentDetectionCount = slot.detectionCount || 0;

          // Check if this is a new detection (status changed to OCCUPIED)
          if (prevStatus && prevStatus.status !== "OCCUPIED" && currentStatus === "OCCUPIED") {
            // New object detected!
            const newActivity = {
              id: Date.now() + Math.random(),
              timestamp: new Date(),
              sensorId: slot.sensorId,
              slotLabel: slot.slotLabel || slot.slotId,
              type: "DETECTION",
              message: `🚗 Ultrasonic Sensor Detected Object!`,
              details: `Sensor ${slot.sensorId} detected a car in slot ${slot.slotLabel || slot.slotId}`,
              detectionCount: currentDetectionCount,
              distance: slot.distance || "N/A"
            };

            setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep last 100 activities
            scrollToBottom();
          }

          // Check if object left (status changed to FREE)
          if (prevStatus && prevStatus.status === "OCCUPIED" && currentStatus === "FREE") {
            const newActivity = {
              id: Date.now() + Math.random(),
              timestamp: new Date(),
              sensorId: slot.sensorId,
              slotLabel: slot.slotLabel || slot.slotId,
              type: "CLEARED",
              message: `✅ Object Cleared - Slot Now Free`,
              details: `Sensor ${slot.sensorId} confirmed slot ${slot.slotLabel || slot.slotId} is now empty`,
              detectionCount: currentDetectionCount,
              distance: slot.distance || "N/A"
            };

            setActivities(prev => [newActivity, ...prev].slice(0, 100));
            scrollToBottom();
          }

          // Update sensor status
          setSensorStatus(prev => ({
            ...prev,
            [slot.sensorId]: {
              status: currentStatus,
              detectionCount: currentDetectionCount,
              lastUpdated: slot.lastUpdated,
              connected: slot.sensorConnected
            }
          }));

          // Check if any sensor is connected
          if (slot.sensorConnected) {
            setIsConnected(true);
          }
        }
      });
    } catch (err) {
      console.error("Fetch error:", err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activities]);

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000); // seconds

    if (diff < 5) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
              <Activity className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ESP32 Activity Log</h1>
              <p className="text-gray-400 text-sm">Real-time ultrasonic sensor detection events</p>
            </div>
          </div>

          {/* Connection Status */}
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ 
              background: isConnected ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${isConnected ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`
            }}
          >
            <div 
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
            />
            <Wifi className={`w-4 h-4 ${isConnected ? "text-green-400" : "text-red-400"}`} />
            <span className={`text-sm font-medium ${isConnected ? "text-green-400" : "text-red-400"}`}>
              {isConnected ? "Sensor Connected" : "No Sensors"}
            </span>
          </div>
        </div>

        {/* Info Banner */}
        <div 
          className="p-4 rounded-xl flex items-start gap-3"
          style={{ 
            background: "rgba(59,130,246,0.08)", 
            border: "1px solid rgba(59,130,246,0.2)" 
          }}
        >
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 text-sm font-medium mb-1">
              Monitoring ultrasonic sensor activity
            </p>
            <p className="text-gray-400 text-xs">
              This page shows real-time detection events when the ESP32 ultrasonic sensor detects objects. 
              Events are logged automatically and displayed below.
            </p>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ 
          background: "rgba(255,255,255,0.02)", 
          border: "1px solid rgba(139,92,246,0.15)" 
        }}
      >
        {/* Log Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ 
            background: "rgba(139,92,246,0.08)", 
            borderBottom: "1px solid rgba(139,92,246,0.15)" 
          }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            <span className="text-white font-semibold">Detection Events</span>
            <span 
              className="px-2 py-1 rounded-full text-xs font-semibold"
              style={{ 
                background: "rgba(139,92,246,0.2)", 
                color: "#a78bfa" 
              }}
            >
              {activities.length} events
            </span>
          </div>
          <span className="text-gray-400 text-sm">Auto-refreshing every 2 seconds</span>
        </div>

        {/* Log Content */}
        <div className="p-6">
          {activities.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No Activity Yet</p>
              <p className="text-gray-500 text-sm">
                Waiting for ultrasonic sensor to detect objects...
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Make sure ESP32 is connected and sensor is working
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="p-4 rounded-lg transition-all hover:scale-[1.02] animate-fadeIn"
                  style={{ 
                    background: activity.type === "DETECTION" 
                      ? "rgba(239,68,68,0.08)" 
                      : "rgba(34,197,94,0.08)",
                    border: `1px solid ${
                      activity.type === "DETECTION" 
                        ? "rgba(239,68,68,0.2)" 
                        : "rgba(34,197,94,0.2)"
                    }`,
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: activity.type === "DETECTION" 
                          ? "rgba(239,68,68,0.15)" 
                          : "rgba(34,197,94,0.15)"
                      }}
                    >
                      {activity.type === "DETECTION" ? (
                        <Car className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p 
                            className="font-semibold text-lg mb-1"
                            style={{ 
                              color: activity.type === "DETECTION" ? "#f87171" : "#4ade80"
                            }}
                          >
                            {activity.message}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {activity.details}
                          </p>
                        </div>
                        <span className="text-gray-500 text-xs whitespace-nowrap">
                          {getTimeAgo(activity.timestamp)}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Sensor:</span>
                          <span className="text-violet-400 font-mono">{activity.sensorId}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Slot:</span>
                          <span className="text-white font-medium">{activity.slotLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Detection #:</span>
                          <span className="text-violet-400 font-bold">{activity.detectionCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Time:</span>
                          <span className="text-gray-400">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* CSS for fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ESP32ActivityLog;
