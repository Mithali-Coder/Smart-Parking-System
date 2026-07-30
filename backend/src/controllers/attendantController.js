import { Parking } from "../models/Parking.js";
import { Level } from "../models/Level.js";
import { Slot } from "../models/Slot.js";
import { User } from "../models/User.js";

/**
 * Get dashboard KPIs for attendant
 * GET /api/attendant/dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("[Attendant Dashboard] User ID:", userId);

    // Verify user is attendant
    const user = await User.findById(userId);
    if (!user || user.role !== "attendant") {
      return res.status(403).json({ message: "Access denied. Attendant role required." });
    }

    // Get parking assigned to this attendant
    const parking = await Parking.findOne({
      attendants: userId,
      isActive: true
    });

    if (!parking) {
      console.log("[Attendant Dashboard] No parking assigned to attendant:", userId);
      return res.status(404).json({ 
        message: "No parking assigned to this attendant",
        hasParking: false
      });
    }

    console.log("[Attendant Dashboard] Assigned Parking ID:", parking._id);

    // Get all levels for this parking
    const levels = await Level.find({
      parkingId: parking._id,
      isActive: true
    });

    const levelIds = levels.map(l => l._id);
    console.log("[Attendant Dashboard] Level IDs:", levelIds);

    // Get all slots for this parking's levels
    const slots = await Slot.find({
      parkingId: parking._id,
      levelId: { $in: levelIds }
    });

    console.log("[Attendant Dashboard] Total slots found:", slots.length);

    // Calculate KPIs
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === "FREE" || s.status === "available").length;
    const bookedSlots = slots.filter(s => s.status === "OCCUPIED" || s.status === "booked").length;
    const blockedSlots = slots.filter(s => s.status === "BLOCKED" || s.status === "blocked").length;

    console.log("[Attendant Dashboard] KPIs - Total:", totalSlots, "Available:", availableSlots, "Booked:", bookedSlots, "Blocked:", blockedSlots);

    res.json({
      parkingId: parking._id,
      parkingName: parking.name,
      totalSlots,
      availableSlots,
      bookedSlots,
      blockedSlots
    });
  } catch (error) {
    console.error("[Attendant Dashboard] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get levels for attendant's assigned parking
 * GET /api/attendant/levels
 */
export const getLevels = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("[Attendant Levels] User ID:", userId);

    // Verify user is attendant
    const user = await User.findById(userId);
    if (!user || user.role !== "attendant") {
      return res.status(403).json({ message: "Access denied. Attendant role required." });
    }

    // Get parking assigned to this attendant
    const parking = await Parking.findOne({
      attendants: userId,
      isActive: true
    });

    if (!parking) {
      console.log("[Attendant Levels] No parking assigned");
      return res.status(404).json({ 
        message: "No parking assigned to this attendant",
        levels: []
      });
    }

    console.log("[Attendant Levels] Parking ID:", parking._id);

    // Get levels for this parking, sorted by levelNumber DESC (top floor first)
    const levels = await Level.find({
      parkingId: parking._id,
      isActive: true
    }).sort({ levelNumber: -1 });

    console.log("[Attendant Levels] Levels found:", levels.length);

    res.json({
      parkingId: parking._id,
      parkingName: parking.name,
      levels: levels.map(level => ({
        id: level._id,
        levelNumber: level.levelNumber,
        levelName: level.levelName,
        rows: level.rows,
        columns: level.columns
      }))
    });
  } catch (error) {
    console.error("[Attendant Levels] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get BookMyShow-style layout metadata for attendant
 * GET /api/attendant/parking/:parkingId/level/:levelId
 */
export const getLevelLayout = async (req, res) => {
  try {
    const { parkingId, levelId } = req.params;
    const userId = req.user.id;

    console.log("[Attendant Level Layout] User ID:", userId, "Parking ID:", parkingId, "Level ID:", levelId);

    // Verify user is attendant
    const user = await User.findById(userId);
    if (!user || user.role !== "attendant") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify attendant has access to this parking
    const parking = await Parking.findById(parkingId);
    if (!parking) {
      console.log("[Attendant Level Layout] Parking not found:", parkingId);
      return res.status(404).json({ message: "Parking not found" });
    }

    if (!parking.attendants.includes(userId)) {
      console.log("[Attendant Level Layout] Access denied - attendant not assigned to parking");
      return res.status(403).json({ message: "Access denied to this parking" });
    }

    // Get level
    const level = await Level.findById(levelId);
    if (!level || level.parkingId.toString() !== parkingId) {
      console.log("[Attendant Level Layout] Level not found or doesn't belong to parking");
      return res.status(404).json({ message: "Level not found" });
    }

    console.log("[Attendant Level Layout] Level found:", level.levelName, "Rows:", level.rows, "Columns:", level.columns);

    // Get all slots for this level AND parking
    const slots = await Slot.find({ 
      parkingId: parkingId,
      levelId: levelId
    }).sort({ rowIndex: 1, columnIndex: 1 });

    console.log("[Attendant Level Layout] Slots found:", slots.length);

    // Format response - BookMyShow style
    res.json({
      level: {
        id: level._id,
        levelName: level.levelName,
        levelNumber: level.levelNumber,
        rows: level.rows.length,
        columns: level.columns,
        rowLabels: level.rows,
        columnLabels: Array.from({ length: level.columns }, (_, i) => String(i + 1).padStart(2, '0'))
      },
      slots: slots.map(slot => ({
        id: slot._id,
        slotLabel: slot.slotLabel,
        rowIndex: slot.rowIndex,
        columnIndex: slot.columnIndex,
        status: slot.status,
        slotType: slot.slotType,
        vehicleNumber: slot.vehicleNumber || null
      }))
    });
  } catch (error) {
    console.error("[Attendant Level Layout] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
