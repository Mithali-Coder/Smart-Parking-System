import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { Parking } from "../models/Parking.js";
import { Level } from "../models/Level.js";
import { Slot } from "../models/Slot.js";
import { User } from "../models/User.js";

dotenv.config();

/**
 * Seed dummy data for development/testing
 * Only runs if database is empty
 */
const seedDummyData = async () => {
  await connectDB();

  try {
    // Check if data already exists
    const existingParking = await Parking.findOne({ name: "Phoenix Mall Parking" });
    if (existingParking) {
      return;
    }

    // Find or create attendant
    let attendant = await User.findOne({ email: "attendant@example.com" });
    if (!attendant) {
      console.log("⚠️  Attendant not found. Please run 'npm run seed' first.");
      return;
    }

    // Create Phoenix Mall Parking
    const parking = await Parking.create({
      name: "Phoenix Mall Parking",
      location: "Pune",
      address: "Pune",
      type: "Mall",
      totalLevels: 2,
      attendants: [attendant._id],
      isActive: true,
      status: "active"
    });

    // Create Level 2 (L2) - rows: ["A","B","C"], columns: 10
    const level2 = await Level.create({
      parkingId: parking._id,
      levelNumber: 2,
      levelName: "L2",
      rows: ["A", "B", "C"],
      columns: 10,
      rowLabels: ["A", "B", "C"],
      columnLabels: Array(10).fill(null).map((_, i) => String(i + 1).padStart(2, "0")),
      displayOrder: 2,
      isActive: true
    });

    // Create slots for L2
    const slotsL2 = [];
    const statusesL2 = ["available", "booked", "blocked"];
    ["A", "B", "C"].forEach((row, rowIndex) => {
      for (let col = 1; col <= 10; col++) {
        const slotId = `${row}${String(col).padStart(2, "0")}`;
        const rand = Math.random();
        let status = "available";
        if (rand < 0.2) status = "booked";
        else if (rand < 0.3) status = "blocked";

        slotsL2.push({
          parkingId: parking._id,
          levelId: level2._id,
          slotId,
          slotLabel: slotId,
          row,
          column: col,
          rowIndex,
          columnIndex: col - 1,
          status,
          type: "car",
          slotType: "CAR",
          vehicleNumber: status === "booked" ? `MH12AB${1000 + col}` : null
        });
      }
    });

    await Slot.insertMany(slotsL2);

    // Create Level 1 (L1) - rows: ["A","B","C","D"], columns: 12
    const level1 = await Level.create({
      parkingId: parking._id,
      levelNumber: 1,
      levelName: "L1",
      rows: ["A", "B", "C", "D"],
      columns: 12,
      rowLabels: ["A", "B", "C", "D"],
      columnLabels: Array(12).fill(null).map((_, i) => String(i + 1).padStart(2, "0")),
      displayOrder: 1,
      isActive: true
    });

    // Create slots for L1
    const slotsL1 = [];
    ["A", "B", "C", "D"].forEach((row, rowIndex) => {
      for (let col = 1; col <= 12; col++) {
        const slotId = `${row}${String(col).padStart(2, "0")}`;
        const rand = Math.random();
        let status = "available";
        if (rand < 0.15) status = "booked";
        else if (rand < 0.25) status = "blocked";

        slotsL1.push({
          parkingId: parking._id,
          levelId: level1._id,
          slotId,
          slotLabel: slotId,
          row,
          column: col,
          rowIndex,
          columnIndex: col - 1,
          status,
          type: "car",
          slotType: "CAR",
          vehicleNumber: status === "booked" ? `MH12CD${1000 + col}` : null
        });
      }
    });

    await Slot.insertMany(slotsL1);
  } catch (error) {
    console.error("❌ Dummy data seed error:", error);
  }
};

// Only run in development
if (process.env.NODE_ENV !== "production") {
  seedDummyData().catch((error) => {
    console.error("Dummy data seeding failed:", error);
  });
}

export default seedDummyData;
