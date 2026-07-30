import mongoose from "mongoose";
import dotenv from "dotenv";
import { Slot } from "./src/models/Slot.js";
import { Parking } from "./src/models/Parking.js";
import { Level } from "./src/models/Level.js";

dotenv.config();

const cleanOrphanedSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all slots
    const allSlots = await Slot.find({});
    console.log(`\n📊 Total slots before cleanup: ${allSlots.length}`);

    // Get all parkings
    const parkings = await Parking.find({});
    const parkingIds = parkings.map(p => p._id.toString());

    // Get all levels
    const levels = await Level.find({});
    const levelIds = levels.map(l => l._id.toString());

    // Find orphaned slots (parking doesn't exist)
    const orphanedSlots = allSlots.filter(slot => {
      const parkingId = slot.parkingId?.toString();
      return !parkingId || !parkingIds.includes(parkingId);
    });

    console.log(`\n⚠️  Found ${orphanedSlots.length} orphaned slots (parking doesn't exist)`);

    if (orphanedSlots.length > 0) {
      console.log("\n🗑️  Deleting orphaned slots...");
      const orphanedIds = orphanedSlots.map(s => s._id);
      const deleteResult = await Slot.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`   ✅ Deleted ${deleteResult.deletedCount} orphaned slots`);
    }

    // Find slots with invalid level references
    const invalidLevelSlots = allSlots.filter(slot => {
      const levelId = slot.levelId?.toString();
      return levelId && !levelIds.includes(levelId);
    });

    console.log(`\n⚠️  Found ${invalidLevelSlots.length} slots with invalid level references`);

    if (invalidLevelSlots.length > 0) {
      console.log("\n🗑️  Deleting slots with invalid level references...");
      const invalidIds = invalidLevelSlots.map(s => s._id);
      const deleteResult = await Slot.deleteMany({ _id: { $in: invalidIds } });
      console.log(`   ✅ Deleted ${deleteResult.deletedCount} slots with invalid levels`);
    }

    // Get final count
    const finalSlots = await Slot.find({});
    console.log(`\n📊 Total slots after cleanup: ${finalSlots.length}`);

    // Summary by parking
    console.log("\n📋 Slots by Parking:");
    for (const parking of parkings) {
      const parkingSlots = finalSlots.filter(s => s.parkingId?.toString() === parking._id.toString());
      console.log(`   ${parking.name}: ${parkingSlots.length} slots`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Cleanup complete! Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

cleanOrphanedSlots();
