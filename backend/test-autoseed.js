import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import { Parking } from "./src/models/Parking.js";
import { Level } from "./src/models/Level.js";
import { Slot } from "./src/models/Slot.js";
import { autoSeedPhoenixMallSlots } from "./src/seed/autoSeedSlots.js";

dotenv.config();

const testAutoSeed = async () => {
  try {
    console.log("🔍 Testing Auto-Seed Functionality...\n");
    
    await connectDB();

    // Check current state
    const parking = await Parking.findOne({ name: "Phoenix Mall Parking" });
    if (!parking) {
      console.log("❌ Phoenix Mall Parking not found. Please run 'npm run seed' first.");
      process.exit(1);
    }

    console.log(`✅ Found parking: ${parking.name} (ID: ${parking._id})`);

    const levels = await Level.find({ parkingId: parking._id });
    console.log(`📊 Levels found: ${levels.length}`);
    
    for (const level of levels) {
      const slotCount = await Slot.countDocuments({
        parkingId: parking._id,
        levelId: level._id
      });
      console.log(`   - ${level.levelName}: ${slotCount} slots`);
    }

    console.log("\n🔧 Running auto-seed...\n");
    await autoSeedPhoenixMallSlots();

    console.log("\n📊 Final state:");
    const levelsAfter = await Level.find({ parkingId: parking._id });
    for (const level of levelsAfter) {
      const slotCount = await Slot.countDocuments({
        parkingId: parking._id,
        levelId: level._id
      });
      const freeCount = await Slot.countDocuments({
        parkingId: parking._id,
        levelId: level._id,
        status: "FREE"
      });
      const occupiedCount = await Slot.countDocuments({
        parkingId: parking._id,
        levelId: level._id,
        status: "OCCUPIED"
      });
      const blockedCount = await Slot.countDocuments({
        parkingId: parking._id,
        levelId: level._id,
        status: "BLOCKED"
      });
      
      console.log(`   - ${level.levelName}: ${slotCount} total (${freeCount} free, ${occupiedCount} occupied, ${blockedCount} blocked)`);
    }

    console.log("\n✅ Auto-seed test completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
};

testAutoSeed();
