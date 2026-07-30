import mongoose from "mongoose";
import dotenv from "dotenv";
import { Slot } from "./src/models/Slot.js";
import { Parking } from "./src/models/Parking.js";
import { Level } from "./src/models/Level.js";

dotenv.config();

const checkDuplicateSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all slots
    const allSlots = await Slot.find({});
    console.log(`\n📊 Total slots in database: ${allSlots.length}`);

    // Get all parkings
    const parkings = await Parking.find({});
    console.log(`📊 Total parkings: ${parkings.length}`);

    // Get all levels
    const levels = await Level.find({});
    console.log(`📊 Total levels: ${levels.length}`);

    // Group slots by parking
    const slotsByParking = {};
    for (const slot of allSlots) {
      const parkingId = slot.parkingId?.toString() || "unknown";
      if (!slotsByParking[parkingId]) {
        slotsByParking[parkingId] = [];
      }
      slotsByParking[parkingId].push(slot);
    }

    console.log("\n📋 Slots by Parking:");
    for (const [parkingId, slots] of Object.entries(slotsByParking)) {
      const parking = parkings.find(p => p._id.toString() === parkingId);
      const parkingName = parking ? parking.name : "Unknown/Deleted";
      console.log(`  ${parkingName} (${parkingId}): ${slots.length} slots`);
    }

    // Check for duplicate slot labels within same parking
    console.log("\n🔍 Checking for duplicate slot labels:");
    for (const [parkingId, slots] of Object.entries(slotsByParking)) {
      const parking = parkings.find(p => p._id.toString() === parkingId);
      const parkingName = parking ? parking.name : "Unknown";
      
      const labelCounts = {};
      for (const slot of slots) {
        const label = slot.slotLabel;
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      }

      const duplicates = Object.entries(labelCounts).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log(`  ⚠️  ${parkingName}:`);
        duplicates.forEach(([label, count]) => {
          console.log(`     - ${label}: ${count} times`);
        });
      }
    }

    // Check for orphaned slots (parking doesn't exist)
    const orphanedSlots = allSlots.filter(slot => {
      const parkingId = slot.parkingId?.toString();
      return !parkings.find(p => p._id.toString() === parkingId);
    });

    if (orphanedSlots.length > 0) {
      console.log(`\n⚠️  Found ${orphanedSlots.length} orphaned slots (parking doesn't exist)`);
      console.log("   These should be deleted.");
    }

    // Check for slots with invalid level references
    const invalidLevelSlots = allSlots.filter(slot => {
      const levelId = slot.levelId?.toString();
      return levelId && !levels.find(l => l._id.toString() === levelId);
    });

    if (invalidLevelSlots.length > 0) {
      console.log(`\n⚠️  Found ${invalidLevelSlots.length} slots with invalid level references`);
      console.log("   These should be deleted.");
    }

    // Summary
    console.log("\n📊 Summary:");
    console.log(`   Total slots: ${allSlots.length}`);
    console.log(`   Active parkings: ${parkings.filter(p => p.isActive !== false).length}`);
    console.log(`   Active levels: ${levels.filter(l => l.isActive !== false).length}`);
    console.log(`   Orphaned slots: ${orphanedSlots.length}`);
    console.log(`   Invalid level slots: ${invalidLevelSlots.length}`);

    const validSlots = allSlots.length - orphanedSlots.length - invalidLevelSlots.length;
    console.log(`   Valid slots: ${validSlots}`);

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkDuplicateSlots();
