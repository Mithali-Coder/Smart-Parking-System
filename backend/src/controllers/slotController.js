import { Slot } from "../models/Slot.js";

export const getSlots = async (req, res) => {
  try {
    const slots = await Slot.find({}).sort({ slotNumber: 1 });
    res.json(slots);
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSlotStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["FREE", "OCCUPIED", "RESERVED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const slot = await Slot.findById(id);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    slot.status = status;
    slot.lastUpdated = new Date();
    await slot.save();

    res.json(slot);
  } catch (error) {
    console.error("Update slot status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mock sensor update endpoint (can be called by a background job or external system)
export const mockSensorUpdate = async (req, res) => {
  const { sensorId } = req.params;
  const { status } = req.body;

  try {
    const slot = await Slot.findOne({ sensorId });
    if (!slot) {
      return res.status(404).json({ message: "Slot not found for sensor" });
    }

    if (status && ["FREE", "OCCUPIED", "RESERVED"].includes(status)) {
      slot.status = status;
    }
    slot.lastUpdated = new Date();
    await slot.save();

    res.json(slot);
  } catch (error) {
    console.error("Mock sensor update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

