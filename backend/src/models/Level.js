import mongoose from "mongoose";

const levelSchema = new mongoose.Schema(
  {
    parkingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parking",
      required: true
    },
    levelNumber: {
      type: Number,
      required: true,
      min: 1
    },
    levelName: {
      type: String,
      required: true,
      trim: true
    },
    // Grid configuration - rows as array of strings (e.g., ["A","B","C","D"])
    rows: [{
      type: String,
      required: true
    }],
    // Number of columns
    columns: {
      type: Number,
      required: true,
      min: 1
    },
    // Row labels (kept for backward compatibility, same as rows)
    rowLabels: [{
      type: String
    }],
    // Column labels (auto-generated from columns)
    columnLabels: [{
      type: String
    }],
    // Display order (higher number = shown first, like top floor)
    displayOrder: {
      type: Number,
      required: true,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Ensure unique level number per parking
levelSchema.index({ parkingId: 1, levelNumber: 1 }, { unique: true });

// Index for sorting by display order
levelSchema.index({ parkingId: 1, displayOrder: -1 });

export const Level = mongoose.model("Level", levelSchema);
