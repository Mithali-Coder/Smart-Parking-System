import express from "express";
import { getSlots, updateSlotStatus, mockSensorUpdate } from "../controllers/slotController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", auth, getSlots);
router.put("/:id/status", auth, authorizeRoles("admin", "attendant"), updateSlotStatus);
router.post("/sensor/:sensorId", auth, authorizeRoles("admin"), mockSensorUpdate);

export default router;

