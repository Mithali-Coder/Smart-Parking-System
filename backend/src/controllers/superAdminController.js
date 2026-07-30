import { User } from "../models/User.js";
import { Parking } from "../models/Parking.js";
import { Slot } from "../models/Slot.js";
import { Booking } from "../models/Booking.js";
import bcrypt from "bcryptjs";

/**
 * Get system-wide dashboard stats
 */
export const getSystemStats = async (req, res) => {
  try {
    const [totalAdmins, totalAttendants, totalParkings, slots, bookings] = await Promise.all([
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "attendant" }),
      Parking.countDocuments({}),
      Slot.find({}, "status"),
      Booking.find({}, "bookingTime createdAt").sort({ createdAt: -1 }).limit(100)
    ]);

    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(s => s.status === "OCCUPIED").length;
    const freeSlots = slots.filter(s => s.status === "FREE").length;
    const reservedSlots = slots.filter(s => s.status === "RESERVED").length;
    const occupancyRate = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookings = bookings.filter(b => new Date(b.createdAt) >= today).length;

    res.json({
      totalAdmins,
      totalAttendants,
      totalParkings,
      totalSlots,
      occupiedSlots,
      freeSlots,
      reservedSlots,
      occupancyRate: `${occupancyRate}%`,
      todayBookings,
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all admins
 */
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Enrich with their parking count
    const enriched = await Promise.all(admins.map(async (admin) => {
      const parkingCount = await Parking.countDocuments({ createdBy: admin._id });
      const attendantCount = await User.countDocuments({ 
        role: "attendant", 
        assignedParking: { $in: await Parking.distinct("_id", { createdBy: admin._id }) }
      });
      return {
        ...admin.toObject(),
        parkingCount,
        attendantCount
      };
    }));

    res.json({ admins: enriched });
  } catch (error) {
    console.error("Get all admins error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create a new admin account
 */
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: "admin",
      createdBy: req.user._id,
      isActive: true
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update an admin account
 */
export const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, phone, isActive } = req.body;

    const admin = await User.findOne({ _id: adminId, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase();
    if (phone !== undefined) admin.phone = phone;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    res.json({
      message: "Admin updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete an admin account
 */
export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findOne({ _id: adminId, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await User.findByIdAndDelete(adminId);

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Toggle admin active status
 */
export const toggleAdminStatus = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findOne({ _id: adminId, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      message: `Admin ${admin.isActive ? "activated" : "deactivated"} successfully`,
      isActive: admin.isActive
    });
  } catch (error) {
    console.error("Toggle admin status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Reset admin password
 */
export const resetAdminPassword = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const admin = await User.findOne({ _id: adminId, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: "Admin password reset successfully" });
  } catch (error) {
    console.error("Reset admin password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all parkings (system-wide view)
 */
export const getAllParkingsGlobal = async (req, res) => {
  try {
    const parkings = await Parking.find({})
      .populate("attendants", "name email")
      .sort({ createdAt: -1 });

    // Enrich with slot statistics
    const enriched = await Promise.all(parkings.map(async (parking) => {
      const slots = await Slot.find({ parkingId: parking._id });
      const totalSlots = slots.length;
      const occupiedSlots = slots.filter(s => s.status === "OCCUPIED").length;
      const freeSlots = slots.filter(s => s.status === "FREE" || s.status === "available").length;
      const reservedSlots = slots.filter(s => s.status === "RESERVED" || s.status === "booked").length;
      const blockedSlots = slots.filter(s => s.status === "BLOCKED" || s.status === "blocked").length;

      return {
        ...parking.toObject(),
        slotStats: {
          total: totalSlots,
          occupied: occupiedSlots,
          free: freeSlots,
          reserved: reservedSlots,
          blocked: blockedSlots
        }
      };
    }));

    res.json({ parkings: enriched });
  } catch (error) {
    console.error("Get all parkings global error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get parking details with levels and slots (Super Admin)
 */
export const getParkingDetails = async (req, res) => {
  try {
    const { parkingId } = req.params;

    const parking = await Parking.findById(parkingId)
      .populate("attendants", "name email phone");

    if (!parking) {
      return res.status(404).json({ message: "Parking not found" });
    }

    const { Level } = await import("../models/Level.js");
    const levels = await Level.find({ parkingId })
      .sort({ displayOrder: -1, levelNumber: -1 });

    // Get slots for each level
    const levelsWithSlots = await Promise.all(
      levels.map(async (level) => {
        const slots = await Slot.find({ levelId: level._id })
          .sort({ rowIndex: 1, columnIndex: 1 });

        return {
          ...level.toObject(),
          slots
        };
      })
    );

    res.json({
      parking,
      levels: levelsWithSlots
    });
  } catch (error) {
    console.error("Get parking details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update slot status (Super Admin root level)
 */
export const updateSlotStatusGlobal = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { status } = req.body;

    if (!["FREE", "OCCUPIED", "RESERVED", "BLOCKED", "available", "booked", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    slot.status = status;
    if (status === "FREE" || status === "available") {
      slot.vehicleNumber = null;
      slot.bookedBy = null;
      slot.bookedAt = null;
    }
    slot.lastUpdated = new Date();
    await slot.save();

    res.json({
      message: "Slot status updated successfully",
      slot
    });
  } catch (error) {
    console.error("Update slot status global error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Bulk update slot statuses (Super Admin)
 */
export const bulkUpdateSlotStatus = async (req, res) => {
  try {
    const { slotIds, status } = req.body;

    if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
      return res.status(400).json({ message: "slotIds array is required" });
    }

    if (!["FREE", "OCCUPIED", "RESERVED", "BLOCKED", "available", "booked", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = {
      status,
      lastUpdated: new Date()
    };

    if (status === "FREE" || status === "available") {
      updateData.vehicleNumber = null;
      updateData.bookedBy = null;
      updateData.bookedAt = null;
    }

    const result = await Slot.updateMany(
      { _id: { $in: slotIds } },
      { $set: updateData }
    );

    res.json({
      message: `${result.modifiedCount} slots updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Bulk update slot status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
