import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import adminParkingRoutes from "./routes/adminParkingRoutes.js";
import attendantRoutes from "./routes/attendantRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";         // ← NEW
import { releaseExpiredReservations } from "./controllers/bookingController.js";
import seedDummyData from "./seed/dummyData.js";
import { autoSeedPhoenixMallSlots } from "./seed/autoSeedSlots.js";
import { startSensorHealthCheck } from "./jobs/sensorHealthCheck.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "192.168.1.101";

// CORS configuration for local network access
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));

// Health
app.get("/", (req, res) => res.json({ message: "Smart Parking API is running" }));
app.get("/api/test", (req, res) => res.json({ message: "API is working", timestamp: new Date().toISOString() }));

app.get("/api/diagnostic", async (req, res) => {
  try {
    const { User } = await import("./models/User.js");
    const { Slot } = await import("./models/Slot.js");
    const userCount = await User.countDocuments();
    const slotCount = await Slot.countDocuments();
    const users = await User.find({}, "email role name").limit(5);
    res.json({ status: "ok", userCount, slotCount, sampleUsers: users.map(u => ({ email: u.email, role: u.role, name: u.name })) });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Auth routes
app.use("/api/auth", authRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/admin", adminParkingRoutes);
app.use("/api/attendant", attendantRoutes);
app.use("/api/super-admin", superAdminRoutes);

// ── Sensor routes (NO JWT – used by ESP32) ────────────────────────────────────
app.use("/api/sensor", sensorRoutes);

const startServer = async () => {
  await connectDB();
  if (process.env.NODE_ENV !== "production") {
    await seedDummyData();
    await autoSeedPhoenixMallSlots();
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📡 Accessible on local network`);
    console.log(`${"=".repeat(60)}`);
    console.log(`\n📱 ESP32 Sensor Endpoints:`);
    console.log(`   POST http://${HOST}:${PORT}/api/sensor/update`);
    console.log(`   GET  http://${HOST}:${PORT}/api/sensor/ping`);
    console.log(`\n🌐 Frontend should use:`);
    console.log(`   http://${HOST}:${PORT}`);
    console.log(`${"=".repeat(60)}\n`);
  });
  const intervalMinutes = parseInt(process.env.RELEASE_CHECK_MINUTES || "1", 10);
  setInterval(() => {
    releaseExpiredReservations().catch(err => console.error("Release error:", err));
  }, intervalMinutes * 60 * 1000);
  
  // Start sensor health monitoring
  startSensorHealthCheck();
};

startServer().catch(err => { console.error("Failed to start:", err); process.exit(1); });
