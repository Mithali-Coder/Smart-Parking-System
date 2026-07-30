import mongoose from "mongoose";
import dotenv from "dotenv";
import { Slot } from "./src/models/Slot.js";

dotenv.config();

async function addSensorIds() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // 1. Fetch all slots to see what we're working with
  const allSlots = await Slot.find({}, "slotId slotLabel sensorId").lean();
  console.log(`\nTotal slots found: ${allSlots.length}`);

  // 2. Set sensorId: "SENSOR_001" on slot A02
  const a02Result = await Slot.updateOne(
    { $or: [{ slotId: "A02" }, { slotLabel: "A02" }] },
    { $set: { sensorId: "SENSOR_001", sensorConnected: true } }
  );
  console.log(`\nSlot A02 update → matched: ${a02Result.matchedCount}, modified: ${a02Result.modifiedCount}`);

  // 3. For all other slots that have no sensorId, assign a placeholder
  //    so the field is explicitly present in every document.
  //    Format: SENSOR_<slotId>  e.g. SENSOR_B01
  const slotsWithoutSensor = allSlots.filter(
    (s) => !s.sensorId && (s.slotId !== "A02") && (s.slotLabel !== "A02")
  );

  console.log(`\nSlots without a sensorId (excluding A02): ${slotsWithoutSensor.length}`);

  let updated = 0;
  for (const slot of slotsWithoutSensor) {
    const label = slot.slotId || slot.slotLabel || slot._id.toString();
    const generatedId = `SENSOR_${label}`;
    await Slot.updateOne(
      { _id: slot._id },
      { $set: { sensorId: generatedId } }
    );
    updated++;
  }

  console.log(`✅ Assigned generated sensorIds to ${updated} slots`);

  // 4. Print a summary of all slots and their sensorIds
  const updatedSlots = await Slot.find({}, "slotId slotLabel sensorId sensorConnected").lean();
  console.log("\n--- Slot / SensorId Summary ---");
  updatedSlots.forEach((s) => {
    console.log(`  ${(s.slotId || s.slotLabel || "???").padEnd(10)} → ${s.sensorId || "null"}`);
  });

  await mongoose.disconnect();
  console.log("\n✅ Done. Disconnected.");
}

addSensorIds().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
