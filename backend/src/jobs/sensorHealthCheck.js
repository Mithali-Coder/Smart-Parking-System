import { Slot } from "../models/Slot.js";

/**
 * Check sensor health and mark as disconnected if no update for 30 seconds
 */
export const checkSensorHealth = async () => {
  try {
    const TIMEOUT_MS = 30000; // 30 seconds
    const cutoffTime = new Date(Date.now() - TIMEOUT_MS);

    // Find slots that were connected but haven't updated recently
    const result = await Slot.updateMany(
      {
        sensorConnected: true,
        lastUpdated: { $lt: cutoffTime }
      },
      {
        $set: { sensorConnected: false }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`⚠️  Marked ${result.modifiedCount} sensors as disconnected (timeout)`);
    }
  } catch (error) {
    console.error("Sensor health check error:", error);
  }
};

/**
 * Start the sensor health check interval
 */
export const startSensorHealthCheck = () => {
  // Run every 10 seconds
  setInterval(checkSensorHealth, 10000);
  console.log("✅ Sensor health check started (runs every 10 seconds)");
};
