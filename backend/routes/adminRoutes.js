import express from "express";
import { getAdminDashboard } from "../controllers/adminController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, admin, getAdminDashboard);
router.get("/orders/admin", protect, admin, getAdminDashboard);
export default router;
