import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
    bookingTime: { type: Date, default: Date.now },
    expiryTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["RESERVED", "ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"],
      default: "RESERVED"
    }
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);

