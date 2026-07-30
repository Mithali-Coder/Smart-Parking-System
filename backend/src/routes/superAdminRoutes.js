import express from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getSystemStats,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  getAllParkingsGlobal,
  getParkingDetails,
  updateSlotStatusGlobal,
  bulkUpdateSlotStatus
} from "../controllers/superAdminController.js";

const router = express.Router();

// All routes require super_admin role
router.use(auth);
router.use(authorizeRoles("super_admin"));

// System stats
router.get("/stats", getSystemStats);

// Admin management
router.get("/admins", getAllAdmins);
router.post("/admins", createAdmin);
router.put("/admins/:adminId", updateAdmin);
router.delete("/admins/:adminId", deleteAdmin);
router.put("/admins/:adminId/status", toggleAdminStatus);
router.post("/admins/:adminId/reset-password", resetAdminPassword);

// Global parkings view
router.get("/parkings", getAllParkingsGlobal);
router.get("/parkings/:parkingId", getParkingDetails);

// Slot management at root level
router.put("/slots/:slotId/status", updateSlotStatusGlobal);
router.post("/slots/bulk-update", bulkUpdateSlotStatus);

export default router;
