import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import { Parking } from "./src/models/Parking.js";
import { Level } from "./src/models/Level.js";
import { Slot } from "./src/models/Slot.js";

dotenv.config();

const testAPIEndpoint = async () => {
  try {
    await connectDB();
    
    console.log("\n🧪 Simulating API Endpoint: GET /api/parking/levels/:levelId/slots\n");
    
    // Find parking and level
    const parking = await Parking.findOne({ name: "Phoenix Mall Parking" });
    const level = await Level.findOne({ parkingId: parking._id, levelName: "L2" });
    
    console.log(`📍 Parking: ${parking.name} (${parking._id})`);
    console.log(`📍 Level: ${level.levelName} (${level._id})\n`);
    
    // Simulate the API query (BEFORE FIX)
    console.log("❌ BEFORE FIX - Query by levelId only:");
    const slotsBefore = await Slot.find({
      levelId: level._id
    }).sort({ rowIndex: 1, columnIndex: 1 });
    console.log(`   Found: ${slotsBefore.length} slots\n`);
    
    // Simulate the API query (AFTER FIX)
    console.log("✅ AFTER FIX - Query by parkingId AND levelId:");
    const slotsAfter = await Slot.find({
      parkingId: parking._id,
      levelId: level._id
    }).sort({ rowIndex: 1, columnIndex: 1 });
    console.log(`   Found: ${slotsAfter.length} slots\n`);
    
    // Show sample response
    console.log("📦 API Response Format:");
    const response = {
      level: {
        id: level._id,
        levelNumber: level.levelNumber,
        levelName: level.levelName,
        rows: level.rows.length,
        columns: level.columns,
        rowLabels: level.rowLabels,
        columnLabels: level.columnLabels
      },
      slots: slotsAfter.slice(0, 5).map(slot => ({
        id: slot._id,
        slotLabel: slot.slotLabel,
        rowIndex: slot.rowIndex,
        columnIndex: slot.columnIndex,
        status: slot.status,
        slotType: slot.slotType,
        vehicleNumber: slot.vehicleNumber || null
      }))
    };
    
    console.log(JSON.stringify(response, null, 2));
    
    console.log(`\n✅ API endpoint would return ${slotsAfter.length} slots`);
    console.log(`✅ Frontend can now render the parking grid!`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testAPIEndpoint();
