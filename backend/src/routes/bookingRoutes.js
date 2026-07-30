import express from "express";
import { createBooking, getBookingHistory } from "../controllers/bookingController.js";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", auth, authorizeRoles("user"), createBooking);
router.get("/history", auth, authorizeRoles("admin"), getBookingHistory);

export default router;

