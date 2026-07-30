import axios from "axios";

const API_BASE = "http://localhost:5000/api";

async function testBookSlot() {
  try {
    console.log("🧪 Testing Book Slot Endpoint\n");

    // Step 1: Login as attendant
    console.log("1️⃣ Logging in as attendant...");
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: "attendant@phoenixmall.com",
      password: "attendant123"
    });
    
    const token = loginRes.data.token;
    console.log("✅ Login successful");
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Get parking config
    console.log("\n2️⃣ Getting parking config...");
    const configRes = await axios.get(`${API_BASE}/parking/attendant/config`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("✅ Parking config retrieved");
    console.log(`   Parking: ${configRes.data.parking.name}`);
    console.log(`   Levels: ${configRes.data.levels.length}`);

    // Step 3: Get slots for first level
    const firstLevel = configRes.data.levels[0];
    console.log(`\n3️⃣ Getting slots for ${firstLevel.levelName}...`);
    const slotsRes = await axios.get(
      `${API_BASE}/parking/levels/${firstLevel.id}/slots`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("✅ Slots retrieved");
    console.log(`   Total slots: ${slotsRes.data.slots.length}`);
    
    // Find a FREE slot
    const freeSlot = slotsRes.data.slots.find(s => s.status === "FREE");
    if (!freeSlot) {
      console.log("❌ No free slots available");
      return;
    }
    
    console.log(`   Found free slot: ${freeSlot.slotLabel} (ID: ${freeSlot.id})`);

    // Step 4: Book the slot
    console.log(`\n4️⃣ Booking slot ${freeSlot.slotLabel}...`);
    console.log(`   Slot ID: ${freeSlot.id}`);
    console.log(`   Vehicle Number: MH12TEST1234`);
    
    const bookRes = await axios.post(
      `${API_BASE}/parking/slots/${freeSlot.id}/book`,
      { vehicleNumber: "MH12TEST1234" },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        } 
      }
    );
    
    console.log("✅ Slot booked successfully!");
    console.log(`   Slot: ${bookRes.data.slot.slotLabel}`);
    console.log(`   Status: ${bookRes.data.slot.status}`);
    console.log(`   Vehicle: ${bookRes.data.slot.vehicleNumber}`);

    // Step 5: Release the slot
    console.log(`\n5️⃣ Releasing slot ${freeSlot.slotLabel}...`);
    const releaseRes = await axios.post(
      `${API_BASE}/parking/slots/${freeSlot.id}/release`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("✅ Slot released successfully!");
    console.log(`   Status: ${releaseRes.data.slot.status}`);

    console.log("\n✅ All tests passed!");

  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

testBookSlot();
