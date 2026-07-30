import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { Parking } from "../models/Parking.js";
import { Level } from "../models/Level.js";
import { Slot } from "../models/Slot.js";
import { User } from "../models/User.js";

dotenv.config();

const runParkingSeed = async () => {
  await connectDB();

  try {
    // Find or create attendant
    let attendant = await User.findOne({ email: "attendant@example.com" });
    if (!attendant) {
      console.log("⚠️  Attendant not found. Please run 'npm run seed' first.");
      process.exit(1);
    }

    // Create a sample parking
    let parking = await Parking.findOne({ name: "Main Parking Lot" });
    if (parking) {
      console.log("Parking already exists. Skipping...");
      // Clean up existing levels and slots
      await Level.deleteMany({ parkingId: parking._id });
      await Slot.deleteMany({ parkingId: parking._id });
    } else {
      parking = await Parking.create({
        name: "Main Parking Lot",
        location: "City Center", // REQUIRED FIELD
        address: "123 Main Street, City Center",
        totalLevels: 3,
        attendants: [attendant._id]
      });
    }

    console.log(`✅ Created/Updated Parking: ${parking.name}`);

    // Create Level 3 (Top Floor) - 5 rows x 8 columns
    const level3 = await Level.create({
      parkingId: parking._id,
      levelNumber: 3,
      levelName: "Level 3 - Top Floor",
      rows: ["A", "B", "C", "D", "E"],
      columns: 8,
      rowLabels: ["A", "B", "C", "D", "E"],
      columnLabels: ["01", "02", "03", "04", "05", "06", "07", "08"],
      displayOrder: 3
    });

    const slots3 = [];
    let slotNum3 = 10001; // Use high numbers to avoid conflicts
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        const rowLabel = level3.rowLabels[row];
        const colLabel = level3.columnLabels[col];
        const slotId = `${rowLabel}${colLabel}`;
        const slotLabel = slotId;
        
        slots3.push({
          parkingId: parking._id,
          levelId: level3._id,
          slotNumber: slotNum3++,
          slotId,
          slotLabel,
          row: rowLabel,
          column: col + 1,
          rowIndex: row,
          columnIndex: col,
          status: row === 0 && col < 2 ? "OCCUPIED" : "FREE",
          type: "car",
          slotType: "CAR",
          vehicleNumber: row === 0 && col < 2 ? `MH12AB${1000 + col}` : null
        });
      }
    }
    await Slot.insertMany(slots3);
    console.log(`✅ Created Level 3: ${slots3.length} slots`);

    // Create Level 2 - 6 rows x 10 columns
    const level2 = await Level.create({
      parkingId: parking._id,
      levelNumber: 2,
      levelName: "Level 2 - Middle Floor",
      rows: ["A", "B", "C", "D", "E", "F"],
      columns: 10,
      rowLabels: ["A", "B", "C", "D", "E", "F"],
      columnLabels: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"],
      displayOrder: 2
    });

    const slots2 = [];
    let slotNum2 = 20001; // Use high numbers to avoid conflicts
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 10; col++) {
        const rowLabel = level2.rowLabels[row];
        const colLabel = level2.columnLabels[col];
        const slotId = `${rowLabel}${colLabel}`;
        const slotLabel = slotId;
        
        // Some slots blocked, some occupied
        let status = "FREE";
        if (row === 5 && col >= 8) status = "BLOCKED";
        if (row === 0 && col < 3) status = "OCCUPIED";
        
        slots2.push({
          parkingId: parking._id,
          levelId: level2._id,
          slotNumber: slotNum2++,
          slotId,
          slotLabel,
          row: rowLabel,
          column: col + 1,
          rowIndex: row,
          columnIndex: col,
          status,
          type: row === 5 ? "bike" : "car",
          slotType: row === 5 ? "BIKE" : "CAR",
          vehicleNumber: status === "OCCUPIED" ? `MH12CD${1000 + col}` : null
        });
      }
    }
    await Slot.insertMany(slots2);
    console.log(`✅ Created Level 2: ${slots2.length} slots`);

    // Create Level 1 (Ground Floor) - 4 rows x 6 columns
    const level1 = await Level.create({
      parkingId: parking._id,
      levelNumber: 1,
      levelName: "Level 1 - Ground Floor",
      rows: ["A", "B", "C", "D"],
      columns: 6,
      rowLabels: ["A", "B", "C", "D"],
      columnLabels: ["01", "02", "03", "04", "05", "06"],
      displayOrder: 1
    });

    const slots1 = [];
    let slotNum1 = 30001; // Use high numbers to avoid conflicts
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const rowLabel = level1.rowLabels[row];
        const colLabel = level1.columnLabels[col];
        const slotId = `${rowLabel}${colLabel}`;
        const slotLabel = slotId;
        
        // First column for disabled parking
        const slotType = col === 0 ? "DISABLED" : "CAR";
        const type = col === 0 ? "disabled" : "car";
        
        slots1.push({
          parkingId: parking._id,
          levelId: level1._id,
          slotNumber: slotNum1++,
          slotId,
          slotLabel,
          row: rowLabel,
          column: col + 1,
          rowIndex: row,
          columnIndex: col,
          status: "FREE",
          type,
          slotType
        });
      }
    }
    await Slot.insertMany(slots1);
    console.log(`✅ Created Level 1: ${slots1.length} slots`);

    console.log("\n✅ Parking seed completed successfully!");
    console.log(`📊 Parking: ${parking.name}`);
    console.log(`📊 Total Levels: 3`);
    console.log(`📊 Total Slots: ${slots1.length + slots2.length + slots3.length}`);
    console.log(`👤 Assigned Attendant: ${attendant.email}`);
    console.log("\n💡 Login as attendant to see the BookMyShow-style parking grid!");
  } catch (error) {
    console.error("Parking seed error:", error);
  } finally {
    process.exit(0);
  }
};

runParkingSeed();
