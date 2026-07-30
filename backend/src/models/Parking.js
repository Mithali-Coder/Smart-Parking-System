import mongoose from "mongoose";

const parkingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: false // Keep for backward compatibility
    },
    type: {
      type: String,
      enum: ["Mall", "Building", "Open Parking"],
      default: "Mall"
    },
    totalLevels: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    // Attendants assigned to this parking
    attendants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    // Configuration metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Index for quick lookup by attendant
parkingSchema.index({ attendants: 1 });

export const Parking = mongoose.model("Parking", parkingSchema);
