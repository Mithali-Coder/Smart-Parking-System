import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";
import { User } from "./src/models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const checkUsers = async () => {
  console.log("\n🔍 ========== USER DATABASE CHECK ==========\n");
  
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    const users = await User.find({});
    console.log(`📊 Total users in database: ${users.length}\n`);

    if (users.length === 0) {
      console.log("❌ NO USERS FOUND IN DATABASE!");
      console.log("💡 Please run: npm run seed\n");
      process.exit(1);
    }

    console.log("👥 Users found:\n");
    for (const user of users) {
      console.log(`  📧 Email: ${user.email}`);
      console.log(`  👤 Name: ${user.name}`);
      console.log(`  🎭 Role: ${user.role}`);
      console.log(`  🔐 Password Hash: ${user.password.substring(0, 20)}...`);
      console.log(`  ✅ Active: ${user.isActive}`);
      console.log("");
    }

    // Test password comparison for each user
    console.log("🔐 Testing password comparison:\n");
    
    const testCases = [
      { email: "admin@example.com", password: "admin123" },
      { email: "attendant@example.com", password: "attendant123" },
      { email: "user1@example.com", password: "user123" },
      { email: "user2@example.com", password: "user123" }
    ];

    for (const testCase of testCases) {
      const user = await User.findOne({ email: testCase.email });
      if (user) {
        const isMatch = await user.comparePassword(testCase.password);
        console.log(`  ${isMatch ? "✅" : "❌"} ${testCase.email} with password "${testCase.password}": ${isMatch ? "MATCH" : "NO MATCH"}`);
        
        // Also test bcrypt directly
        const directMatch = await bcrypt.compare(testCase.password, user.password);
        console.log(`     Direct bcrypt: ${directMatch ? "MATCH" : "NO MATCH"}`);
      } else {
        console.log(`  ⚠️  ${testCase.email} not found in database`);
      }
    }

    console.log("\n==========================================\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkUsers();
