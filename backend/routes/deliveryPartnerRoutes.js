import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { uploadDeliveryPartner } from "../middleware/upload.js";
import {
  registerDeliveryPartner,
  getMyPartnerProfile,
  getMyAssignedOrders,
  updateLocation,
  generateDeliveryOtp,
  verifyDeliveryOtp,
  getAllPartners,
  getActivePartners,
  acceptPartner,
  declinePartner,
  assignPartnerToOrders,
  unassignPartnerFromOrder,
  getPendingPartnerCount,
} from "../controllers/deliveryPartnerController.js";

const router = express.Router();

router.get("/mine", protect, getMyPartnerProfile);
router.get("/my-orders", protect, getMyAssignedOrders);
router.post(
  "/",
  protect,
  uploadDeliveryPartner.array("images", 5),
  registerDeliveryPartner,
);
router.put("/location", protect, updateLocation);
router.post("/orders/:orderId/generate-otp", protect, generateDeliveryOtp);
router.post("/orders/:orderId/verify-otp", protect, verifyDeliveryOtp);
router.get("/admin/all", protect, admin, getAllPartners);
router.get("/admin/active", protect, admin, getActivePartners);
router.get("/admin/pending-count", protect, admin, getPendingPartnerCount);
router.put("/admin/orders/assign", protect, admin, assignPartnerToOrders);
router.put(
  "/admin/orders/:orderId/unassign",
  protect,
  admin,
  unassignPartnerFromOrder,
);
router.put("/admin/:id/accept", protect, admin, acceptPartner);
router.put("/admin/:id/decline", protect, admin, declinePartner);

export default router;
