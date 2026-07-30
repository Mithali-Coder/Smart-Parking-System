/**
 * Run: node seed-super-admin.js
 * Creates a super_admin user if one doesn't exist
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./src/models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/smart_parking";

async function seedSuperAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ role: "super_admin" });
    if (existing) {
      console.log("ℹ️  Super admin already exists:", existing.email);
      console.log("   Password: superadmin123 (if created by this script)");
      process.exit(0);
    }

    const superAdmin = await User.create({
      name: "Super Admin",
      email: "superadmin@sps.com",
      password: "superadmin123",
      role: "super_admin",
      isActive: true,
    });

    console.log("\n🎉 Super Admin created successfully!");
    console.log("   Email:    superadmin@sps.com");
    console.log("   Password: superadmin123");
    console.log("   Role:     super_admin\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

seedSuperAdmin();
