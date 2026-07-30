import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import { Parking } from "./src/models/Parking.js";
import { Level } from "./src/models/Level.js";
import { Slot } from "./src/models/Slot.js";

dotenv.config();

const verifySlots = async () => {
  try {
    await connectDB();
    
    const parking = await Parking.findOne({ name: "Phoenix Mall Parking" });
    console.log(`\n✅ Parking: ${parking.name} (ID: ${parking._id})`);
    
    const level = await Level.findOne({ parkingId: parking._id, levelName: "L2" });
    console.log(`✅ Level: ${level.levelName} (ID: ${level._id})`);
    console.log(`   Grid: ${level.rows.length} rows × ${level.columns} columns`);
    console.log(`   Rows: ${level.rows.join(", ")}`);
    
    const slots = await Slot.find({
      parkingId: parking._id,
      levelId: level._id
    }).sort({ rowIndex: 1, columnIndex: 1 }).limit(10);
    
    console.log(`\n📊 Sample slots (first 10):`);
    slots.forEach(slot => {
      console.log(`   ${slot.slotLabel}: Row ${slot.row} (${slot.rowIndex}), Col ${slot.column} (${slot.columnIndex}), Status: ${slot.status}${slot.vehicleNumber ? `, Vehicle: ${slot.vehicleNumber}` : ''}`);
    });
    
    const totalSlots = await Slot.countDocuments({
      parkingId: parking._id,
      levelId: level._id
    });
    
    console.log(`\n✅ Total slots for ${level.levelName}: ${totalSlots}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

verifySlots();
