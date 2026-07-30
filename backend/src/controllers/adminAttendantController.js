import { User } from "../models/User.js";
import { Parking } from "../models/Parking.js";
import bcrypt from "bcryptjs";

/**
 * Get all attendants
 */
export const getAllAttendants = async (req, res) => {
  try {
    const attendants = await User.find({ role: "attendant" })
      .populate("assignedParking", "name address")
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ attendants });
  } catch (error) {
    console.error("Get all attendants error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create attendant
 */
export const createAttendant = async (req, res) => {
  try {
    const { name, email, phone, password, assignedParkings, isActive } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Verify parkings exist
    if (assignedParkings && assignedParkings.length > 0) {
      const parkings = await Parking.find({ _id: { $in: assignedParkings } });
      if (parkings.length !== assignedParkings.length) {
        return res.status(400).json({ message: "Invalid parking IDs" });
      }
    }

    const attendant = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      password,
      role: "attendant",
      assignedParking: assignedParkings || [],
      isActive: isActive !== false
    });

    // Update parking attendants
    if (assignedParkings && assignedParkings.length > 0) {
      await Parking.updateMany(
        { _id: { $in: assignedParkings } },
        { $addToSet: { attendants: attendant._id } }
      );
    }

    const attendantData = await User.findById(attendant._id)
      .populate("assignedParking", "name address")
      .select("-password");

    res.status(201).json({
      message: "Attendant created successfully",
      attendant: attendantData
    });
  } catch (error) {
    console.error("Create attendant error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update attendant
 */
export const updateAttendant = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const { name, phone, password, assignedParkings, isActive } = req.body;

    const attendant = await User.findById(attendantId);
    if (!attendant || attendant.role !== "attendant") {
      return res.status(404).json({ message: "Attendant not found" });
    }

    if (name) attendant.name = name;
    if (phone !== undefined) attendant.phone = phone;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      attendant.password = password; // Will be hashed by pre-save hook
    }
    if (isActive !== undefined) attendant.isActive = isActive;

    // Handle parking assignments
    if (assignedParkings !== undefined) {
      const oldParkings = attendant.assignedParking.map(p => p.toString());
      const newParkings = assignedParkings.map(p => p.toString());

      // Remove from old parkings
      const toRemove = oldParkings.filter(p => !newParkings.includes(p));
      if (toRemove.length > 0) {
        await Parking.updateMany(
          { _id: { $in: toRemove } },
          { $pull: { attendants: attendantId } }
        );
      }

      // Add to new parkings
      const toAdd = newParkings.filter(p => !oldParkings.includes(p));
      if (toAdd.length > 0) {
        await Parking.updateMany(
          { _id: { $in: toAdd } },
          { $addToSet: { attendants: attendantId } }
        );
      }

      attendant.assignedParking = assignedParkings;
    }

    await attendant.save();

    const attendantData = await User.findById(attendant._id)
      .populate("assignedParking", "name address")
      .select("-password");

    res.json({
      message: "Attendant updated successfully",
      attendant: attendantData
    });
  } catch (error) {
    console.error("Update attendant error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete attendant
 */
export const deleteAttendant = async (req, res) => {
  try {
    const { attendantId } = req.params;

    const attendant = await User.findById(attendantId);
    if (!attendant || attendant.role !== "attendant") {
      return res.status(404).json({ message: "Attendant not found" });
    }

    // Remove from parkings
    if (attendant.assignedParking && attendant.assignedParking.length > 0) {
      await Parking.updateMany(
        { _id: { $in: attendant.assignedParking } },
        { $pull: { attendants: attendantId } }
      );
    }

    await User.findByIdAndDelete(attendantId);

    res.json({ message: "Attendant deleted successfully" });
  } catch (error) {
    console.error("Delete attendant error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Toggle attendant status
 */
export const toggleAttendantStatus = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const { isActive } = req.body;

    const attendant = await User.findById(attendantId);
    if (!attendant || attendant.role !== "attendant") {
      return res.status(404).json({ message: "Attendant not found" });
    }

    attendant.isActive = isActive !== undefined ? isActive : !attendant.isActive;
    await attendant.save();

    res.json({
      message: "Attendant status updated",
      attendant: await User.findById(attendantId).select("-password")
    });
  } catch (error) {
    console.error("Toggle attendant status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Reset attendant password
 */
export const resetAttendantPassword = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const attendant = await User.findById(attendantId);
    if (!attendant || attendant.role !== "attendant") {
      return res.status(404).json({ message: "Attendant not found" });
    }

    attendant.password = password; // Will be hashed by pre-save hook
    await attendant.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
