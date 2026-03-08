import User from "../models/userModel.js";
import mongoose from "mongoose";

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "wishlist",
      "name price discountedPrice images brand quantity views salesCount expiryDate",
    );
    res.json(user.wishlist || []);
  } catch (err) {
    console.error("getWishlist error:", err);
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;

    // Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const idx = user.wishlist.findIndex((id) => id.toString() === productId);

    if (idx === -1) {
      user.wishlist.push(new mongoose.Types.ObjectId(productId));
    } else {
      user.wishlist.splice(idx, 1);
    }

    await user.save();

    res.json({ wishlist: user.wishlist });
  } catch (err) {
    console.error("toggleWishlist error:", err.message, err.stack);
    res.status(500).json({ message: "Toggle failed", error: err.message });
  }
};
