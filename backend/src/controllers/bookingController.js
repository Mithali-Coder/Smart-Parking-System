import { Booking } from "../models/Booking.js";
import { Slot } from "../models/Slot.js";

const RESERVATION_MINUTES = parseInt(process.env.RESERVATION_MINUTES || "15", 10);

// Find nearest free slot (by smallest slotNumber)
const findNearestFreeSlot = async () => {
  return Slot.findOne({ status: "FREE" }).sort({ slotNumber: 1 });
};

export const createBooking = async (req, res) => {
  const userId = req.user._id;

  try {
    const slot = await findNearestFreeSlot();
    if (!slot) {
      return res.status(400).json({ message: "No free slots available" });
    }

    // Prevent double booking on the same slot
    const existingActive = await Booking.findOne({
      slotId: slot._id,
      status: { $in: ["RESERVED", "ACTIVE"] }
    });
    if (existingActive) {
      return res.status(400).json({ message: "Selected slot is already booked" });
    }

    const now = new Date();
    const expiryTime = new Date(now.getTime() + RESERVATION_MINUTES * 60000);

    const booking = await Booking.create({
      userId,
      slotId: slot._id,
      bookingTime: now,
      expiryTime,
      status: "RESERVED"
    });

    slot.status = "RESERVED";
    slot.lastUpdated = now;
    await slot.save();

    res.status(201).json({
      message: "Slot reserved successfully",
      booking
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBookingHistory = async (req, res) => {
  try {
    const history = await Booking.find({})
      .populate("userId", "name email role")
      .populate("slotId", "slotNumber")
      .sort({ bookingTime: -1 });

    res.json(history);
  } catch (error) {
    console.error("Get booking history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Background job helper to release expired reservations
export const releaseExpiredReservations = async () => {
  const now = new Date();
  const expired = await Booking.find({
    status: "RESERVED",
    expiryTime: { $lte: now }
  });

  if (!expired.length) return;

  const slotIds = expired.map((b) => b.slotId);

  await Slot.updateMany(
    { _id: { $in: slotIds }, status: "RESERVED" },
    { $set: { status: "FREE", lastUpdated: now } }
  );

  await Booking.updateMany(
    { _id: { $in: expired.map((b) => b._id) } },
    { $set: { status: "EXPIRED" } }
  );

  console.log(`Released ${expired.length} expired reservations at ${now.toISOString()}`);
};

