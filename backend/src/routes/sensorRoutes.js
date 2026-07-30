import express from "express";
import { 
  sensorUpdate, 
  getSensorStatus, 
  sensorPing, 
  getAllSlotsStatus, 
  simulateSensor 
} from "../controllers/sensorController.js";
const router = express.Router();

// ESP32 endpoints (no auth)
router.get("/ping", sensorPing);
router.post("/update", sensorUpdate);
router.get("/status/:sensorId", getSensorStatus);

// Config Module endpoints
router.get("/slots", getAllSlotsStatus);
router.post("/simulate", simulateSensor);

export default router;
