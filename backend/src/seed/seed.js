import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Slot } from "../models/Slot.js";

dotenv.config();

const runSeed = async () => {
  await connectDB();

  try {
    await User.deleteMany({});
    await Slot.deleteMany({});

    // Create super admin
    const superAdmin = await User.create({
      name: "Super Admin",
      email: "superadmin@sps.com",
      password: "superadmin123",
      role: "super_admin"
    });

    // Create users
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin"
    });

    const attendant = await User.create({
      name: "Attendant User",
      email: "attendant@example.com",
      password: "attendant123",
      role: "attendant"
    });

    const user1 = await User.create({
      name: "User One",
      email: "user1@example.com",
      password: "user123",
      role: "user"
    });

    const user2 = await User.create({
      name: "User Two",
      email: "user2@example.com",
      password: "user123",
      role: "user"
    });

    // Create 20 legacy slots (for backward compatibility)
    const slotPromises = [];
    for (let i = 1; i <= 20; i++) {
      const row = String.fromCharCode(65 + Math.floor((i - 1) / 5)); // A, B, C, D
      const col = ((i - 1) % 5) + 1;
      const slotId = `${row}${String(col).padStart(2, "0")}`;
      
      slotPromises.push(
        Slot.create({
          slotNumber: i,
          slotId,
          slotLabel: slotId,
          row,
          column: col,
          rowIndex: Math.floor((i - 1) / 5),
          columnIndex: (i - 1) % 5,
          status: "FREE",
          type: "car",
          slotType: "CAR",
          sensorId: `SENSOR-${i.toString().padStart(3, "0")}`
        })
      );
    }
    await Promise.all(slotPromises);

    console.log("Seed completed successfully");
    console.log("Super Admin:", superAdmin.email, "Password: superadmin123");
    console.log("Admin:", admin.email, "Password: admin123");
    console.log("Attendant:", attendant.email, "Password: attendant123");
    console.log("User1:", user1.email, "Password: user123");
    console.log("User2:", user2.email, "Password: user123");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    process.exit(0);
  }
};

runSeed();

