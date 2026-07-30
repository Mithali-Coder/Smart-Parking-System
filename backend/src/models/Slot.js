import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    slotNumber: { type: Number, sparse: true },
    parkingId:  { type: mongoose.Schema.Types.ObjectId, ref: "Parking" },
    levelId:    { type: mongoose.Schema.Types.ObjectId, ref: "Level" },
    slotId:     { type: String, trim: true, required: true },
    slotLabel:  { type: String, trim: true },
    row:        { type: String, required: true },
    column:     { type: Number, required: true, min: 1 },
    rowIndex:   { type: Number, min: 0 },
    columnIndex:{ type: Number, min: 0 },

    // PENDING = slot clicked/being booked right now (locks out other attendants)
    // OCCUPIED = booked + sensor confirmed OR manually set
    // FREE = sensor confirmed empty OR manually released
    status: {
      type: String,
      enum: ["available","booked","blocked","FREE","OCCUPIED","RESERVED","BLOCKED","PENDING"],
      default: "available"
    },

    type:     { type: String, enum: ["car","bike","disabled","CAR","BIKE","DISABLED","PREMIUM"], default: "car" },
    slotType: { type: String, enum: ["CAR","BIKE","DISABLED","PREMIUM","car","bike","disabled"], default: "CAR" },

    sensorId:     { type: String, sparse: true },
    vehicleNumber:{ type: String, trim: true },
    bookedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bookedAt:     { type: Date },

    // When PENDING expires (auto-release if booking never completes)
    pendingExpiry: { type: Date },

    lastUpdated: { type: Date, default: Date.now },
    sensorConnected: { type: Boolean, default: false },
    
    // Detection tracking for ESP32 Monitor
    detectionCount: { type: Number, default: 0 },
    totalReadings: { type: Number, default: 0 },
    lastDetectionTime: { type: Date }
  },
  { timestamps: true }
);

slotSchema.index({ parkingId: 1, levelId: 1 });
slotSchema.index({ levelId: 1, rowIndex: 1, columnIndex: 1 });
slotSchema.index({ slotLabel: 1 });
slotSchema.index({ sensorId: 1 });
slotSchema.index({ levelId: 1, rowIndex: 1, columnIndex: 1 }, { unique: true, sparse: true });

export const Slot = mongoose.model("Slot", slotSchema);
