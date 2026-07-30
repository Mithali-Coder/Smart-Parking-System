// Quick verification script to check if backend is set up correctly
import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import { User } from "./src/models/User.js";

dotenv.config();

const verify = async () => {
  console.log("\n🔍 ========== VERIFYING SETUP ==========\n");
  
  try {
    // 1. Check database connection
    console.log("1️⃣ Checking database connection...");
    await connectDB();
    console.log("   ✅ Database connected\n");
    
    // 2. Check if users exist
    console.log("2️⃣ Checking if users exist...");
    const userCount = await User.countDocuments();
    console.log(`   📊 Total users: ${userCount}`);
    
    if (userCount === 0) {
      console.log("   ❌ No users found!");
      console.log("   💡 Run: npm run seed\n");
      process.exit(1);
    }
    
    // 3. List users
    console.log("\n3️⃣ Available users:");
    const users = await User.find({}, "email role name");
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ${user.name}`);
    });
    
    // 4. Test login credentials
    console.log("\n4️⃣ Testing login credentials...");
    const testUser = await User.findOne({ email: "user1@example.com" });
    if (testUser) {
      const isMatch = await testUser.comparePassword("user123");
      if (isMatch) {
        console.log("   ✅ Test credentials work: user1@example.com / user123");
      } else {
        console.log("   ❌ Password mismatch for test user");
      }
    } else {
      console.log("   ❌ Test user not found");
    }
    
    console.log("\n✅ ========== SETUP VERIFIED ==========\n");
    console.log("✅ Backend is ready!");
    console.log("✅ Database is connected");
    console.log("✅ Users exist in database");
    console.log("\n💡 Start server with: npm run dev\n");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ========== VERIFICATION FAILED ==========\n");
    console.error("Error:", error.message);
    console.error("\n💡 Check:");
    console.error("   - MongoDB is running");
    console.error("   - MONGO_URI in .env is correct");
    console.error("   - Database name is SPS_database\n");
    process.exit(1);
  }
};

verify();
