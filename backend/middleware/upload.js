import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const storageAds = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "ads_offers",
    public_id: `ad-${Date.now()}`,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  }),
});

const storageProduct = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "products",
    public_id: `product-${Date.now()}`,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  }),
});

// ✅ For seller requests
const storageSellerRequest = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "seller_requests",
    public_id: `seller-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  }),
});

// ✅ For delivery partner applications
const storageDeliveryPartner = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "delivery_partners",
    public_id: `partner-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  }),
});

export const upload = multer({ storage: storageAds });
export const uploadProduct = multer({ storage: storageProduct });
export const uploadSellerRequest = multer({ storage: storageSellerRequest });
export const uploadDeliveryPartner = multer({
  storage: storageDeliveryPartner,
});
