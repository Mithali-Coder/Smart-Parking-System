import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import { getDashboard, getLevels, getLevelLayout } from "../controllers/attendantController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get dashboard KPIs
router.get("/dashboard", getDashboard);

// Get levels for attendant's parking
router.get("/levels", getLevels);

// Get level layout (BookMyShow-style)
router.get("/parking/:parkingId/level/:levelId", getLevelLayout);

export default router;
