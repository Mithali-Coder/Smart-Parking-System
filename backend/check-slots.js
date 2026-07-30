import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import { Slot } from "./src/models/Slot.js";

dotenv.config();

const checkSlots = async () => {
  try {
    await connectDB();
    
    const allSlots = await Slot.find({}).limit(10);
    console.log("Sample slots in database:");
    console.log(JSON.stringify(allSlots, null, 2));
    
    const totalSlots = await Slot.countDocuments();
    console.log(`\nTotal slots: ${totalSlots}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkSlots();
