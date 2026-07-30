import { Parking } from "../models/Parking.js";
import { Level } from "../models/Level.js";
import { Slot } from "../models/Slot.js";
import { User } from "../models/User.js";

/**
 * Create a new parking structure
 */
export const createParking = async (req, res) => {
  try {
    const { name, location, address, type, totalLevels, attendants, isActive, status } = req.body;

    if (!name || (!location && !address)) {
      return res.status(400).json({ message: "Name and location are required" });
    }

    // Verify attendants exist and are attendants
    if (attendants && attendants.length > 0) {
      const attendantUsers = await User.find({
        _id: { $in: attendants },
        role: "attendant"
      });
      if (attendantUsers.length !== attendants.length) {
        return res.status(400).json({ message: "Invalid attendant IDs" });
      }
    }

    const parking = await Parking.create({
      name,
      location: location || address,
      address: address || location, // Keep both for compatibility
      type: type || "Mall",
      totalLevels: totalLevels || 1,
      attendants: attendants || [],
      isActive: isActive !== false,
      status: status || "active"
    });

    res.status(201).json({
      message: "Parking created successfully",
      parking
    });
  } catch (error) {
    console.error("Create parking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a level for a parking
 */
export const createLevel = async (req, res) => {
  try {
    const { parkingId } = req.params;
    const { levelNumber, levelName, rows, columns, displayOrder } = req.body;

    // Validate parking exists
    const parking = await Parking.findById(parkingId);
    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    if (!levelNumber || !levelName || !rows || !columns) {
      return res.status(400).json({
        message: "levelNumber, levelName, rows (array), and columns (number) are required"
      });
    }

    // Validate rows is an array of strings
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        message: "rows must be an array of strings (e.g., ['A','B','C'])"
      });
    }

    // Validate columns is a number
    if (typeof columns !== "number" || columns < 1) {
      return res.status(400).json({
        message: "columns must be a number >= 1"
      });
    }

    // Generate column labels (01, 02, 03, ...)
    const columnLabels = Array(columns).fill(null).map((_, i) => String(i + 1).padStart(2, "0"));

    const level = await Level.create({
      parkingId,
      levelNumber,
      levelName,
      rows, // Array of strings like ["A","B","C"]
      columns, // Number
      rowLabels: rows, // Same as rows for backward compatibility
      columnLabels,
      displayOrder: displayOrder !== undefined ? displayOrder : levelNumber
    });

    // Create slots for this level - BookMyShow style
    const slots = [];
    rows.forEach((rowLabel, rowIndex) => {
      for (let col = 1; col <= columns; col++) {
        const slotId = `${rowLabel}${String(col).padStart(2, "0")}`;
        slots.push({
          parkingId,
          levelId: level._id,
          slotId,
          slotLabel: slotId, // For backward compatibility
          row: rowLabel,
          column: col,
          rowIndex,
          columnIndex: col - 1,
          status: "available",
          type: "car",
          slotType: "CAR"
        });
      }
    });

    await Slot.insertMany(slots);

    res.status(201).json({
      message: "Level created successfully",
      level,
      slotsCreated: slots.length
    });
  } catch (error) {
    console.error("Create level error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Level number already exists for this parking" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Assign attendant to parking
 */
export const assignAttendant = async (req, res) => {
  try {
    const { parkingId } = req.params;
    const { attendantId } = req.body;

    const parking = await Parking.findById(parkingId);
    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    const attendant = await User.findById(attendantId);
    if (!attendant || attendant.role !== "attendant") {
      return res.status(400).json({ message: "Invalid attendant ID" });
    }

    if (!parking.attendants.includes(attendantId)) {
      parking.attendants.push(attendantId);
      await parking.save();
    }

    res.json({
      message: "Attendant assigned successfully",
      parking
    });
  } catch (error) {
    console.error("Assign attendant error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all parkings (admin view)
 */
export const getAllParkings = async (req, res) => {
  try {
    const parkings = await Parking.find({})
      .populate("attendants", "name email")
      .sort({ createdAt: -1 });

    res.json({ parkings });
  } catch (error) {
    console.error("Get all parkings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update parking
 */
export const updateParking = async (req, res) => {
  try {
    const { parkingId } = req.params;
    const { name, address, type, totalLevels, isActive } = req.body;

    const parking = await Parking.findById(parkingId);
    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    if (name) parking.name = name;
    if (address) parking.address = address;
    if (type) parking.type = type;
    if (totalLevels !== undefined) parking.totalLevels = totalLevels;
    if (isActive !== undefined) parking.isActive = isActive;

    await parking.save();

    res.json({
      message: "Parking updated successfully",
      parking
    });
  } catch (error) {
    console.error("Update parking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete parking
 */
export const deleteParking = async (req, res) => {
  try {
    const { parkingId } = req.params;

    const parking = await Parking.findById(parkingId);
    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    // Delete associated levels and slots
    const { Level } = await import("../models/Level.js");
    const { Slot } = await import("../models/Slot.js");
    
    const levels = await Level.find({ parkingId });
    const levelIds = levels.map(l => l._id);
    
    await Slot.deleteMany({ parkingId });
    await Slot.deleteMany({ levelId: { $in: levelIds } });
    await Level.deleteMany({ parkingId });
    await Parking.findByIdAndDelete(parkingId);

    res.json({ message: "Parking deleted successfully" });
  } catch (error) {
    console.error("Delete parking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Toggle parking status
 */
export const toggleParkingStatus = async (req, res) => {
  try {
    const { parkingId } = req.params;
    const { isActive } = req.body;

    const parking = await Parking.findById(parkingId);
    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    parking.isActive = isActive !== undefined ? isActive : !parking.isActive;
    await parking.save();

    res.json({
      message: "Parking status updated",
      parking
    });
  } catch (error) {
    console.error("Toggle parking status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get levels for a parking (with slot counts)
 */
export const getParkingLevels = async (req, res) => {
  try {
    const { parkingId } = req.params;

    const levels = await Level.find({ parkingId })
      .sort({ displayOrder: -1, levelNumber: -1 });

    // Get slot counts for each level
    const levelsWithSlotCount = await Promise.all(
      levels.map(async (level) => {
        const slotCount = await Slot.countDocuments({ 
          parkingId, 
          levelId: level._id 
        });
        
        return {
          ...level.toObject(),
          slotCount
        };
      })
    );

    res.json({ levels: levelsWithSlotCount });
  } catch (error) {
    console.error("Get parking levels error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update level
 */
export const updateLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    const { levelNumber, levelName, rows, columns, displayOrder, isActive } = req.body;

    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    if (levelNumber !== undefined) level.levelNumber = levelNumber;
    if (levelName) level.levelName = levelName;
    if (rows !== undefined) level.rows = rows;
    if (columns !== undefined) level.columns = columns;
    if (displayOrder !== undefined) level.displayOrder = displayOrder;
    if (isActive !== undefined) level.isActive = isActive;

    await level.save();

    res.json({
      message: "Level updated successfully",
      level
    });
  } catch (error) {
    console.error("Update level error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete level
 */
export const deleteLevel = async (req, res) => {
  try {
    const { levelId } = req.params;

    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }

    // Delete associated slots
    await Slot.deleteMany({ levelId });
    await Level.findByIdAndDelete(levelId);

    res.json({ message: "Level deleted successfully" });
  } catch (error) {
    console.error("Delete level error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update slot status (admin can block/unblock)
 */
export const updateSlotStatus = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { status } = req.body;

    if (!["FREE", "OCCUPIED", "RESERVED", "BLOCKED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    slot.status = status;
    if (status === "FREE") {
      slot.vehicleNumber = null;
      slot.bookedBy = null;
      slot.bookedAt = null;
    }
    slot.lastUpdated = new Date();
    await slot.save();

    res.json({
      message: "Slot status updated",
      slot
    });
  } catch (error) {
    console.error("Update slot status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
