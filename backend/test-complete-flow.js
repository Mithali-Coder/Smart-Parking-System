import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import { Parking } from "./src/models/Parking.js";
import { Level } from "./src/models/Level.js";
import { Slot } from "./src/models/Slot.js";
import { User } from "./src/models/User.js";

dotenv.config();

const testCompleteFlow = async () => {
  try {
    console.log("\n🧪 COMPLETE ATTENDANT FLOW TEST\n");
    console.log("=" .repeat(60));
    
    await connectDB();
    
    // Step 1: Verify Attendant User
    console.log("\n📋 STEP 1: Verify Attendant User");
    console.log("-".repeat(60));
    const attendant = await User.findOne({ email: "attendant@example.com" });
    if (!attendant) {
      console.log("❌ Attendant user not found!");
      console.log("   Run: npm run seed");
      process.exit(1);
    }
    console.log(`✅ Attendant found: ${attendant.name} (${attendant.email})`);
    console.log(`   Role: ${attendant.role}`);
    console.log(`   ID: ${attendant._id}`);
    
    // Step 2: Verify Parking Assignment
    console.log("\n📋 STEP 2: Verify Parking Assignment");
    console.log("-".repeat(60));
    const parking = await Parking.findOne({
      attendants: attendant._id,
      isActive: true
    });
    if (!parking) {
      console.log("❌ No parking assigned to attendant!");
      process.exit(1);
    }
    console.log(`✅ Parking assigned: ${parking.name}`);
    console.log(`   Location: ${parking.location}`);
    console.log(`   ID: ${parking._id}`);
    console.log(`   Total Levels: ${parking.totalLevels}`);
    
    // Step 3: Verify Levels
    console.log("\n📋 STEP 3: Verify Levels");
    console.log("-".repeat(60));
    const levels = await Level.find({
      parkingId: parking._id,
      isActive: true
    }).sort({ displayOrder: -1 });
    
    if (levels.length === 0) {
      console.log("❌ No levels found for parking!");
      process.exit(1);
    }
    
    console.log(`✅ Found ${levels.length} level(s):`);
    levels.forEach(level => {
      console.log(`   - ${level.levelName}: ${level.rows.length} rows × ${level.columns} columns`);
    });
    
    // Step 4: Verify Slots for Each Level
    console.log("\n📋 STEP 4: Verify Slots for Each Level");
    console.log("-".repeat(60));
    
    for (const level of levels) {
      const slots = await Slot.find({
        parkingId: parking._id,
        levelId: level._id
      });
      
      const freeCount = slots.filter(s => s.status === "FREE").length;
      const occupiedCount = slots.filter(s => s.status === "OCCUPIED").length;
      const blockedCount = slots.filter(s => s.status === "BLOCKED").length;
      
      console.log(`\n   Level ${level.levelName}:`);
      console.log(`   - Total Slots: ${slots.length}`);
      console.log(`   - FREE: ${freeCount}`);
      console.log(`   - OCCUPIED: ${occupiedCount}`);
      console.log(`   - BLOCKED: ${blockedCount}`);
      
      if (slots.length === 0) {
        console.log(`   ⚠️  WARNING: No slots found for ${level.levelName}!`);
      } else {
        console.log(`   ✅ Slots properly configured`);
        
        // Show sample slots
        const sampleSlots = slots.slice(0, 3);
        console.log(`\n   Sample slots:`);
        sampleSlots.forEach(slot => {
          console.log(`   - ${slot.slotLabel}: ${slot.status}${slot.vehicleNumber ? ` (${slot.vehicleNumber})` : ''}`);
        });
      }
    }
    
    // Step 5: Simulate API Response
    console.log("\n📋 STEP 5: Simulate API Response");
    console.log("-".repeat(60));
    
    const testLevel = levels[0];
    const testSlots = await Slot.find({
      parkingId: parking._id,
      levelId: testLevel._id
    }).sort({ rowIndex: 1, columnIndex: 1 });
    
    const apiResponse = {
      level: {
        id: testLevel._id,
        levelNumber: testLevel.levelNumber,
        levelName: testLevel.levelName,
        rows: testLevel.rows.length,
        columns: testLevel.columns,
        rowLabels: testLevel.rowLabels,
        columnLabels: testLevel.columnLabels
      },
      slots: testSlots.map(slot => ({
        id: slot._id,
        slotLabel: slot.slotLabel,
        rowIndex: slot.rowIndex,
        columnIndex: slot.columnIndex,
        status: slot.status,
        slotType: slot.slotType,
        vehicleNumber: slot.vehicleNumber || null
      }))
    };
    
    console.log(`\n✅ API Response for GET /api/parking/levels/${testLevel._id}/slots:`);
    console.log(`   - Level: ${apiResponse.level.levelName}`);
    console.log(`   - Grid: ${apiResponse.level.rows} rows × ${apiResponse.level.columns} columns`);
    console.log(`   - Slots returned: ${apiResponse.slots.length}`);
    
    // Step 6: Verify Grid Rendering
    console.log("\n📋 STEP 6: Verify Grid Rendering");
    console.log("-".repeat(60));
    
    const gridRows = apiResponse.level.rows;
    const gridCols = apiResponse.level.columns;
    const totalExpected = gridRows * gridCols;
    
    console.log(`   Expected slots: ${totalExpected} (${gridRows} × ${gridCols})`);
    console.log(`   Actual slots: ${apiResponse.slots.length}`);
    
    if (apiResponse.slots.length === totalExpected) {
      console.log(`   ✅ Grid is complete!`);
    } else if (apiResponse.slots.length > 0) {
      console.log(`   ⚠️  Grid is partial (${apiResponse.slots.length}/${totalExpected})`);
    } else {
      console.log(`   ❌ Grid is empty!`);
    }
    
    // Final Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(60));
    
    const allChecks = [
      { name: "Attendant user exists", pass: !!attendant },
      { name: "Parking assigned", pass: !!parking },
      { name: "Levels configured", pass: levels.length > 0 },
      { name: "Slots exist", pass: testSlots.length > 0 },
      { name: "Grid complete", pass: testSlots.length === totalExpected }
    ];
    
    allChecks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });
    
    const allPassed = allChecks.every(c => c.pass);
    
    if (allPassed) {
      console.log("\n🎉 ALL CHECKS PASSED!");
      console.log("   The Attendant Dashboard should work correctly.");
      console.log("\n📝 Next Steps:");
      console.log("   1. Login as: attendant@example.com");
      console.log("   2. Navigate to Attendant Dashboard");
      console.log("   3. Select Level L2");
      console.log("   4. View and interact with parking grid");
    } else {
      console.log("\n⚠️  SOME CHECKS FAILED!");
      console.log("   Please review the errors above.");
    }
    
    console.log("\n" + "=".repeat(60) + "\n");
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
};

testCompleteFlow();
