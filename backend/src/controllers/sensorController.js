import { Slot } from "../models/Slot.js";

const SENSOR_API_KEY = process.env.SENSOR_API_KEY || "sps_sensor_secret_2024";

/**
 * ESP32 sensor update
 * Body: { sensorId, distance?, status?, apiKey }
 * 
 * Distance logic:
 *   < 50cm → OCCUPIED
 *   > 70cm → FREE  (only if not manually RESERVED/BLOCKED)
 *   50–70cm → hysteresis, keep current
 * 
 * CRITICAL: if sensor says FREE and slot was PENDING (attendant clicked but car not arrived yet),
 *           keep it PENDING — don't override manual booking flow.
 *           Only override to FREE if sensor confirms empty AND slot was OCCUPIED.
 */
export const sensorUpdate = async (req, res) => {
  const { sensorId, distance, status: rawStatus, detectionCount, totalReadings, apiKey } = req.body;

  // DEBUG LOGGING
  console.log("\n" + "=".repeat(60));
  console.log("📡 SENSOR DATA RECEIVED:");
  console.log("=".repeat(60));
  console.log("Timestamp:", new Date().toISOString());
  console.log("Sensor ID:", sensorId);
  console.log("Distance:", distance, "cm");
  console.log("Status:", rawStatus);
  console.log("Detection Count:", detectionCount || 0);
  console.log("Total Readings:", totalReadings || 0);
  console.log("API Key:", apiKey ? "✓ Provided" : "✗ Missing");
  console.log("=".repeat(60) + "\n");

  if (!apiKey || apiKey !== SENSOR_API_KEY) {
    console.error("❌ Invalid API key provided");
    return res.status(401).json({ success: false, message: "Invalid API key" });
  }
  if (!sensorId) {
    console.error("❌ sensorId missing");
    return res.status(400).json({ success: false, message: "sensorId required" });
  }

  try {
    const slot = await Slot.findOne({ sensorId });
    if (!slot) {
      console.error(`❌ No slot found for sensorId: ${sensorId}`);
      return res.status(404).json({
        success: false,
        message: `No slot mapped to sensorId: ${sensorId}`,
        hint: "Set sensorId in Slot document to match ESP32 SENSOR_ID",
      });
    }

    console.log(`✓ Found slot: ${slot.slotLabel || slot.slotId} (Current status: ${slot.status})`);

    let newStatus = slot.status;
    let changed = false;

    // Determine what sensor is seeing
    let sensorSees = null;
    if (rawStatus && ["FREE", "OCCUPIED"].includes(rawStatus.toUpperCase())) {
      sensorSees = rawStatus.toUpperCase();
    } else if (typeof distance === "number") {
      if (distance < 50) sensorSees = "OCCUPIED";
      else if (distance > 70) sensorSees = "FREE";
      // else hysteresis zone
    }

    if (sensorSees === "OCCUPIED") {
      // Car arrived — mark occupied regardless of booking state
      if (slot.status !== "OCCUPIED") {
        newStatus = "OCCUPIED";
        changed = true;
        console.log(`🚗 Car detected! Changing status: ${slot.status} → OCCUPIED`);
      } else {
        console.log(`ℹ️  Car still present (already OCCUPIED)`);
      }
    } else if (sensorSees === "FREE") {
      // Car left — only set FREE if slot was OCCUPIED (don't clear RESERVED or BLOCKED)
      // Also don't touch PENDING (attendant hasn't finished booking yet)
      if (slot.status === "OCCUPIED") {
        newStatus = "FREE";
        changed = true;
        console.log(`✓ Car left! Changing status: OCCUPIED → FREE`);
      } else {
        console.log(`ℹ️  No car detected (status: ${slot.status}, keeping as is)`);
      }
    } else {
      console.log(`⚠️  Hysteresis zone (50-70cm) - keeping current status: ${slot.status}`);
    }

    if (changed) {
      slot.status = newStatus;
      slot.lastUpdated = new Date();
      slot.sensorConnected = true;
      
      // Update detection tracking
      if (detectionCount !== undefined) {
        slot.detectionCount = detectionCount;
      }
      if (totalReadings !== undefined) {
        slot.totalReadings = totalReadings;
      }
      if (newStatus === "OCCUPIED") {
        slot.lastDetectionTime = new Date();
      }
      
      // When car leaves, clear booking info
      if (newStatus === "FREE") {
        slot.vehicleNumber = null;
        slot.bookedBy = null;
        slot.bookedAt = null;
      }
      await slot.save();
    } else {
      // Even if status didn't change, update lastUpdated and sensorConnected
      slot.lastUpdated = new Date();
      slot.sensorConnected = true;
      
      // Update detection tracking even if status didn't change
      if (detectionCount !== undefined) {
        slot.detectionCount = detectionCount;
      }
      if (totalReadings !== undefined) {
        slot.totalReadings = totalReadings;
      }
      
      await slot.save();
    }

    const response = {
      success: true,
      sensorId,
      slotLabel: slot.slotLabel || slot.slotId,
      slotId: slot._id,
      previousStatus: slot.status,
      status: newStatus,
      changed,
      distance: distance ?? null,
      detectionCount: detectionCount || 0,
      totalReadings: totalReadings || 0,
      timestamp: slot.lastUpdated,
    };

    console.log(`✅ Update successful! Response:`, JSON.stringify(response, null, 2));
    console.log("=".repeat(60) + "\n");

    return res.json(response);
  } catch (error) {
    console.error("❌ Sensor update error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSensorStatus = async (req, res) => {
  const { sensorId } = req.params;
  const { apiKey } = req.query;
  if (!apiKey || apiKey !== SENSOR_API_KEY) return res.status(401).json({ success: false });
  try {
    const slot = await Slot.findOne({ sensorId });
    if (!slot) return res.status(404).json({ success: false, message: "Sensor not found" });
    return res.json({ success: true, sensorId, slotLabel: slot.slotLabel, status: slot.status, lastUpdated: slot.lastUpdated });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export const sensorPing = async (_req, res) => {
  return res.json({ success: true, message: "SPS Sensor API online", ts: new Date().toISOString() });
};

/**
 * Get all slots with sensor status (for Config Module dashboard)
 */
export const getAllSlotsStatus = async (req, res) => {
  try {
    const slots = await Slot.find({})
      .select('slotId slotLabel status sensorId sensorConnected lastUpdated detectionCount totalReadings lastDetectionTime parkingId levelId')
      .populate('parkingId', 'name')
      .populate('levelId', 'name')
      .sort({ slotId: 1 });

    // Check for sensor timeout (30 seconds)
    const now = new Date();
    const TIMEOUT_MS = 30000; // 30 seconds

    const slotsWithTimeout = slots.map(slot => {
      const slotObj = slot.toObject();
      const timeSinceUpdate = now - new Date(slot.lastUpdated);
      
      // If sensor was connected but hasn't updated in 30s, mark as disconnected
      if (slot.sensorConnected && timeSinceUpdate > TIMEOUT_MS) {
        slotObj.sensorConnected = false;
      }

      return slotObj;
    });

    return res.json({
      success: true,
      count: slotsWithTimeout.length,
      slots: slotsWithTimeout
    });
  } catch (error) {
    console.error("Get slots status error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Simulate sensor update (for testing without hardware)
 */
export const simulateSensor = async (req, res) => {
  const { slotId, status } = req.body;

  if (!slotId || !status) {
    return res.status(400).json({ 
      success: false, 
      message: "slotId and status required" 
    });
  }

  if (!["FREE", "OCCUPIED"].includes(status.toUpperCase())) {
    return res.status(400).json({ 
      success: false, 
      message: "status must be FREE or OCCUPIED" 
    });
  }

  try {
    const slot = await Slot.findOne({ slotId });
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: `Slot ${slotId} not found`
      });
    }

    const previousStatus = slot.status;
    const newStatus = status.toUpperCase();

    slot.status = newStatus;
    slot.lastUpdated = new Date();
    slot.sensorConnected = true;

    // When car leaves, clear booking info
    if (newStatus === "FREE") {
      slot.vehicleNumber = null;
      slot.bookedBy = null;
      slot.bookedAt = null;
    }

    await slot.save();

    return res.json({
      success: true,
      slotId: slot.slotId,
      slotLabel: slot.slotLabel || slot.slotId,
      previousStatus,
      newStatus,
      timestamp: slot.lastUpdated,
      message: "Simulated sensor update successful"
    });
  } catch (error) {
    console.error("Simulate sensor error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
