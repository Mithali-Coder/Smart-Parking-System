import express from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getAttendantParking,
  getLevelSlots,
  bookSlot,
  claimSlot,
  unclaimSlot,
  releaseSlot,
} from "../controllers/parkingController.js";

const router = express.Router();

// Attendant config
router.get("/attendant/config", auth, authorizeRoles("attendant", "admin", "super_admin"), getAttendantParking);

// Level slots
router.get("/levels/:levelId/slots", auth, authorizeRoles("attendant", "admin", "super_admin"), getLevelSlots);

// Slot operations
router.post("/slots/:slotId/claim",   auth, authorizeRoles("attendant", "admin", "super_admin"), claimSlot);
router.post("/slots/:slotId/unclaim", auth, authorizeRoles("attendant", "admin", "super_admin"), unclaimSlot);
router.post("/slots/:slotId/book",    auth, authorizeRoles("attendant", "admin", "super_admin"), bookSlot);
router.post("/slots/:slotId/release", auth, authorizeRoles("attendant", "admin", "super_admin"), releaseSlot);

export default router;
