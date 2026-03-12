import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { uploadSellerRequest } from "../middleware/upload.js";

import {
  createSellerRequest,
  getMySellerRequest,
  getAllSellerRequests,
  acceptSellerRequest,
  declineSellerRequest,
  sendChatMessage,
} from "../controllers/sellerRequestController.js";

const router = express.Router();

router.get("/mine", protect, getMySellerRequest);
router.post(
  "/",
  protect,
  uploadSellerRequest.array("images", 5),
  createSellerRequest,
);
router.post("/:id/chat", protect, sendChatMessage);

router.get("/admin/all", protect, admin, getAllSellerRequests);
router.put("/admin/:id/accept", protect, admin, acceptSellerRequest);
router.put("/admin/:id/decline", protect, admin, declineSellerRequest);

export default router;
