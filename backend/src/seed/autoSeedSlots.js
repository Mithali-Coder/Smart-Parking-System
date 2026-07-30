import { Parking } from "../models/Parking.js";
import { Level } from "../models/Level.js";
import { Slot } from "../models/Slot.js";

/**
 * Auto-seed slots for Phoenix Mall Parking if they don't exist
 * This ensures attendants always have data to work with
 */
export const autoSeedPhoenixMallSlots = async () => {
  try {
    console.log("\n🔍 [Auto-Seed] Checking Phoenix Mall Parking slots...");

    // Find Phoenix Mall Parking
    const parking = await Parking.findOne({ name: "Phoenix Mall Parking" });
    
    if (!parking) {
      console.log("⚠️  [Auto-Seed] Phoenix Mall Parking not found. Skipping auto-seed.");
      return;
    }

    console.log(`✅ [Auto-Seed] Found parking: ${parking.name} (ID: ${parking._id})`);

    // Find Level L2
    const levelL2 = await Level.findOne({
      parkingId: parking._id,
      levelName: "L2"
    });

    if (!levelL2) {
      console.log("⚠️  [Auto-Seed] Level L2 not found. Creating it...");
      
      // Create Level L2 if it doesn't exist
      const newLevel = await Level.create({
        parkingId: parking._id,
        levelNumber: 2,
        levelName: "L2",
        rows: ["A", "B", "C", "D"],
        columns: 10,
        rowLabels: ["A", "B", "C", "D"],
        columnLabels: Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, "0")),
        displayOrder: 2,
        isActive: true
      });

      console.log(`✅ [Auto-Seed] Created Level L2 (ID: ${newLevel._id})`);
      
      // Generate slots for the new level
      await generateSlotsForLevel(parking._id, newLevel);
      return;
    }

    console.log(`✅ [Auto-Seed] Found Level L2 (ID: ${levelL2._id})`);

    // Check if slots exist for L2
    const existingSlots = await Slot.countDocuments({
      parkingId: parking._id,
      levelId: levelL2._id
    });

    console.log(`📊 [Auto-Seed] Existing slots for L2: ${existingSlots}`);

    if (existingSlots === 0) {
      console.log("🔧 [Auto-Seed] No slots found. Generating BookMyShow-style grid...");
      await generateSlotsForLevel(parking._id, levelL2);
    } else {
      console.log(`✅ [Auto-Seed] Slots already exist (${existingSlots} slots). Skipping generation.`);
    }

  } catch (error) {
    console.error("❌ [Auto-Seed] Error:", error);
  }
};

/**
 * Generate slots for a specific level
 */
const generateSlotsForLevel = async (parkingId, level) => {
  try {
    const slots = [];
    const rows = level.rows || ["A", "B", "C", "D"];
    const columns = level.columns || 10;

    console.log(`📐 [Auto-Seed] Generating grid: ${rows.length} rows × ${columns} columns`);

    // Generate unique slot numbers starting from a high number to avoid conflicts
    const baseSlotNumber = Date.now() % 1000000; // Use timestamp to ensure uniqueness

    rows.forEach((row, rowIndex) => {
      for (let col = 1; col <= columns; col++) {
        const slotId = `${row}${String(col).padStart(2, "0")}`;
        
        // Status distribution: 70% available, 20% booked, 10% blocked
        const rand = Math.random();
        let status = "FREE"; // Use frontend-compatible status
        let vehicleNumber = null;

        if (rand < 0.20) {
          status = "OCCUPIED";
          vehicleNumber = `MH12${row}${String(1000 + col).slice(-3)}`;
        } else if (rand < 0.30) {
          status = "BLOCKED";
        }

        // Calculate unique slot number for this parking/level
        const slotNumber = baseSlotNumber + (rowIndex * columns) + col;

        slots.push({
          parkingId,
          levelId: level._id,
          slotNumber, // Add slotNumber to avoid duplicate key error
          slotId,
          slotLabel: slotId,
          row,
          column: col,
          rowIndex,
          columnIndex: col - 1,
          status,
          type: "car",
          slotType: "CAR",
          vehicleNumber
        });
      }
    });

    // Insert all slots
    await Slot.insertMany(slots);

    const availableCount = slots.filter(s => s.status === "FREE").length;
    const bookedCount = slots.filter(s => s.status === "OCCUPIED").length;
    const blockedCount = slots.filter(s => s.status === "BLOCKED").length;

    console.log(`✅ [Auto-Seed] Generated ${slots.length} slots for ${level.levelName}:`);
    console.log(`   - Available: ${availableCount}`);
    console.log(`   - Booked: ${bookedCount}`);
    console.log(`   - Blocked: ${blockedCount}`);

  } catch (error) {
    console.error("❌ [Auto-Seed] Error generating slots:", error);
    throw error;
  }
};
