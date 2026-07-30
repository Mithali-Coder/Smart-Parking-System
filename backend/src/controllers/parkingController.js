import { Parking } from "../models/Parking.js";
import { Level } from "../models/Level.js";
import { Slot } from "../models/Slot.js";
import { User } from "../models/User.js";

const PENDING_TTL_SECONDS = 60; // PENDING status auto-expires after 60s if booking never completes

const normalizeStatus = (status) => {
  const map = {
    available: "FREE", booked: "OCCUPIED", blocked: "BLOCKED",
    FREE: "FREE", OCCUPIED: "OCCUPIED", RESERVED: "RESERVED",
    BLOCKED: "BLOCKED", PENDING: "PENDING",
  };
  return map[status] || status;
};

// ─── Get attendant's assigned parking config ──────────────────────────────────
export const getAttendantParking = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.role !== "attendant") {
      return res.status(403).json({ message: "Access denied. Attendant role required." });
    }

    const parking = await Parking.findOne({ attendants: userId, isActive: true })
      .populate("attendants", "name email");

    if (!parking) {
      return res.status(404).json({ message: "No parking assigned to this attendant", hasParking: false });
    }

    const levels = await Level.find({ parkingId: parking._id, isActive: true })
      .sort({ displayOrder: -1, levelNumber: -1 });

    res.json({
      hasParking: true,
      parking: { id: parking._id, name: parking.name, address: parking.address, totalLevels: parking.totalLevels },
      levels: levels.map(l => ({ id: l._id, name: l.levelName, levelNumber: l.levelNumber })),
    });
  } catch (error) {
    console.error("getAttendantParking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Get slots for a level ────────────────────────────────────────────────────
export const getLevelSlots = async (req, res) => {
  try {
    const { levelId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || !["attendant", "admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const level = await Level.findById(levelId).populate("parkingId");
    if (!level) return res.status(404).json({ message: "Level not found" });

    if (user.role === "attendant") {
      const parking = await Parking.findById(level.parkingId._id || level.parkingId);
      if (!parking || !parking.attendants.map(String).includes(String(userId))) {
        return res.status(403).json({ message: "Access denied to this parking" });
      }
    }

    // Auto-release stale PENDING slots (older than TTL)
    const stalePendingCutoff = new Date(Date.now() - PENDING_TTL_SECONDS * 1000);
    await Slot.updateMany(
      { levelId: level._id, status: "PENDING", lastUpdated: { $lt: stalePendingCutoff } },
      { $set: { status: "FREE", vehicleNumber: null, bookedBy: null, bookedAt: null, lastUpdated: new Date() } }
    );

    const slots = await Slot.find({
      parkingId: level.parkingId._id || level.parkingId,
      levelId: level._id,
    }).sort({ rowIndex: 1, columnIndex: 1 });

    const gridSlots = slots.map(s => ({
      id: s._id,
      slotLabel:    s.slotLabel || s.slotId,
      slotId:       s.slotId,
      slotNumber:   s.slotNumber,
      sensorId:     s.sensorId,
      status:       normalizeStatus(s.status),
      slotType:     s.slotType || "CAR",
      vehicleNumber:s.vehicleNumber,
      rowIndex:     s.rowIndex,
      columnIndex:  s.columnIndex,
      lastUpdated:  s.lastUpdated,
      bookedAt:     s.bookedAt,
    }));

    res.json({
      level: {
        id: level._id, levelNumber: level.levelNumber, levelName: level.levelName,
        rows: level.rows, columns: level.columns,
        rowLabels: level.rowLabels, columnLabels: level.columnLabels,
      },
      slots: gridSlots,
    });
  } catch (error) {
    console.error("getLevelSlots error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ATOMIC book slot with concurrency lock ───────────────────────────────────
// Uses findOneAndUpdate with status: "FREE" condition so only ONE attendant wins.
// Returns 409 Conflict if the slot was grabbed by someone else between click and confirm.
export const bookSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { vehicleNumber } = req.body;
    const userId = req.user.id;

    if (!vehicleNumber || vehicleNumber.trim() === "") {
      return res.status(400).json({ message: "Vehicle number is required" });
    }

    const user = await User.findById(userId);
    if (!user || !["attendant", "admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const now = new Date();

    // ── ATOMIC: only update if status is FREE or PENDING (claimed by this user) ──
    // This is the key concurrency guard — MongoDB processes this atomically.
    // If two attendants race, only one gets status: "FREE", the other sees null.
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        $or: [
          { status: "FREE" },
          { status: "available" },
          // Allow confirming a slot that this same user put into PENDING
          { status: "PENDING", bookedBy: userId },
        ],
      },
      {
        $set: {
          status: "OCCUPIED",
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          bookedBy: userId,
          bookedAt: now,
          lastUpdated: now,
        },
      },
      { new: true }
    );

    if (!slot) {
      // Either not found, or slot was grabbed by someone else (race condition)
      const existing = await Slot.findById(slotId);
      if (!existing) return res.status(404).json({ message: "Slot not found" });

      return res.status(409).json({
        message: `Slot ${existing.slotLabel} was just booked by another attendant. Please select a different slot.`,
        currentStatus: normalizeStatus(existing.status),
      });
    }

    return res.json({
      message: "Slot booked successfully",
      slot: {
        id: slot._id,
        slotLabel: slot.slotLabel,
        status: slot.status,
        vehicleNumber: slot.vehicleNumber,
        bookedAt: slot.bookedAt,
      },
    });
  } catch (error) {
    console.error("bookSlot error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Claim a slot as PENDING (optimistic lock before modal opens) ─────────────
// Called the moment attendant clicks a slot — before vehicle number is entered.
// This prevents another attendant from grabbing the same slot simultaneously.
export const claimSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.id;

    const now = new Date();

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, $or: [{ status: "FREE" }, { status: "available" }] },
      {
        $set: {
          status: "PENDING",
          bookedBy: userId,
          lastUpdated: now,
          pendingExpiry: new Date(now.getTime() + PENDING_TTL_SECONDS * 1000),
        },
      },
      { new: true }
    );

    if (!slot) {
      const existing = await Slot.findById(slotId);
      if (!existing) return res.status(404).json({ message: "Slot not found" });
      return res.status(409).json({
        message: `Slot ${existing.slotLabel} is already ${normalizeStatus(existing.status).toLowerCase()}.`,
        currentStatus: normalizeStatus(existing.status),
      });
    }

    return res.json({
      message: "Slot claimed",
      slot: { id: slot._id, slotLabel: slot.slotLabel, status: "PENDING" },
    });
  } catch (error) {
    console.error("claimSlot error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Release claim (attendant cancelled modal) ────────────────────────────────
export const unclaimSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.id;

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: "PENDING", bookedBy: userId },
      { $set: { status: "FREE", bookedBy: null, vehicleNumber: null, lastUpdated: new Date() } },
      { new: true }
    );

    if (!slot) return res.status(404).json({ message: "Slot not found or not claimable" });
    return res.json({ message: "Claim released", slot: { id: slot._id, slotLabel: slot.slotLabel, status: "FREE" } });
  } catch (error) {
    console.error("unclaimSlot error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Release slot (manual by attendant) ──────────────────────────────────────
export const releaseSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || !["attendant", "admin", "super_admin"].includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    slot.status = "FREE";
    slot.vehicleNumber = null;
    slot.bookedBy = null;
    slot.bookedAt = null;
    slot.lastUpdated = new Date();
    await slot.save();

    return res.json({
      message: "Slot released successfully",
      slot: { id: slot._id, slotLabel: slot.slotLabel, status: "FREE" },
    });
  } catch (error) {
    console.error("releaseSlot error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
