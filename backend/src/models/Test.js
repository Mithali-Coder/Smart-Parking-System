import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      default: "Database connection test successful"
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const Test = mongoose.model("Test", testSchema);
