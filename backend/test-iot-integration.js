import axios from "axios";

const BASE_URL = "http://localhost:5000";
const API_KEY = "sps_sensor_secret_2024";

console.log("🧪 Testing IoT Integration...\n");

async function testPing() {
  console.log("1️⃣  Testing sensor ping endpoint...");
  try {
    const response = await axios.get(`${BASE_URL}/api/sensor/ping`);
    console.log("✅ Ping successful:", response.data.message);
    return true;
  } catch (error) {
    console.error("❌ Ping failed:", error.message);
    return false;
  }
}

async function testGetSlots() {
  console.log("\n2️⃣  Testing get all slots endpoint...");
  try {
    const response = await axios.get(`${BASE_URL}/api/sensor/slots`);
    console.log(`✅ Found ${response.data.count} slots`);
    if (response.data.slots.length > 0) {
      const sample = response.data.slots[0];
      console.log(`   Sample slot: ${sample.slotId} - Status: ${sample.status} - Connected: ${sample.sensorConnected}`);
    }
    return response.data.slots;
  } catch (error) {
    console.error("❌ Get slots failed:", error.message);
    return [];
  }
}

async function testSimulate(slotId, status) {
  console.log(`\n3️⃣  Testing simulation: ${slotId} → ${status}...`);
  try {
    const response = await axios.post(`${BASE_URL}/api/sensor/simulate`, {
      slotId,
      status
    });
    console.log(`✅ Simulation successful: ${response.data.previousStatus} → ${response.data.newStatus}`);
    return true;
  } catch (error) {
    console.error("❌ Simulation failed:", error.response?.data?.message || error.message);
    return false;
  }
}

async function testSensorUpdate(sensorId) {
  console.log(`\n4️⃣  Testing sensor update endpoint (sensorId: ${sensorId})...`);
  try {
    const response = await axios.post(`${BASE_URL}/api/sensor/update`, {
      sensorId,
      distance: 45,
      apiKey: API_KEY
    });
    console.log(`✅ Sensor update successful: ${response.data.slotLabel} - ${response.data.status}`);
    return true;
  } catch (error) {
    console.error("❌ Sensor update failed:", error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log("=" .repeat(60));
  console.log("IoT Integration Test Suite");
  console.log("=" .repeat(60));

  // Test 1: Ping
  const pingOk = await testPing();
  if (!pingOk) {
    console.log("\n⚠️  Server not responding. Make sure backend is running:");
    console.log("   cd backend && npm run dev");
    return;
  }

  // Test 2: Get slots
  const slots = await testGetSlots();
  if (slots.length === 0) {
    console.log("\n⚠️  No slots found. Run seed script:");
    console.log("   cd backend && npm run seed");
    return;
  }

  // Test 3: Simulate (use first slot)
  const testSlot = slots[0];
  await testSimulate(testSlot.slotId, "OCCUPIED");
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  await testSimulate(testSlot.slotId, "FREE");

  // Test 4: Sensor update (if slot has sensorId)
  const slotWithSensor = slots.find(s => s.sensorId);
  if (slotWithSensor) {
    await testSensorUpdate(slotWithSensor.sensorId);
  } else {
    console.log("\n⚠️  No slots with sensorId found. To test sensor updates:");
    console.log("   1. Update a slot in MongoDB: db.slots.updateOne({slotId:'A1'}, {$set:{sensorId:'SENSOR_001'}})");
    console.log("   2. Run this test again");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All tests completed!");
  console.log("=".repeat(60));
  console.log("\n📱 Next steps:");
  console.log("   1. Start frontend: cd frontend && npm run dev");
  console.log("   2. Login as Super Admin");
  console.log("   3. Navigate to Config Module");
  console.log("   4. Test simulation buttons in UI");
  console.log("\n");
}

runTests().catch(error => {
  console.error("\n❌ Test suite failed:", error.message);
  process.exit(1);
});
