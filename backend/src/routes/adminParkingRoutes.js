import express from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createParking,
  createLevel,
  assignAttendant,
  getAllParkings,
  updateParking,
  deleteParking,
  toggleParkingStatus,
  getParkingLevels,
  updateLevel,
  deleteLevel,
  updateSlotStatus
} from "../controllers/adminParkingController.js";
import {
  getAllAttendants,
  createAttendant,
  updateAttendant,
  deleteAttendant,
  toggleAttendantStatus,
  resetAttendantPassword
} from "../controllers/adminAttendantController.js";

const router = express.Router();

// All routes require admin role
router.use(auth);
router.use(authorizeRoles("admin"));

// Parking management
router.post("/parkings", createParking);
router.get("/parkings", getAllParkings);
router.put("/parkings/:parkingId", updateParking);
router.delete("/parkings/:parkingId", deleteParking);
router.put("/parkings/:parkingId/status", toggleParkingStatus);
router.get("/parkings/:parkingId/levels", getParkingLevels);
router.post("/parkings/:parkingId/levels", createLevel);
router.post("/parkings/:parkingId/attendants", assignAttendant);

// Level management
router.put("/levels/:levelId", updateLevel);
router.delete("/levels/:levelId", deleteLevel);

// Slot management
router.put("/slots/:slotId/status", updateSlotStatus);

// Attendant management
router.get("/attendants", getAllAttendants);
router.post("/attendants", createAttendant);
router.put("/attendants/:attendantId", updateAttendant);
router.delete("/attendants/:attendantId", deleteAttendant);
router.put("/attendants/:attendantId/status", toggleAttendantStatus);
router.post("/attendants/:attendantId/reset-password", resetAttendantPassword);

export default router;
