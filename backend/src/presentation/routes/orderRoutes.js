import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { OrderController } from "../controllers/OrderController.js";
import { validateRequest } from "../middleware/validation.js";
import { uploadEReceipt } from "../middleware/cloudinaryUpload.js";

const router = express.Router();
const orderController = new OrderController();

// Ensure upload directory exists (simple, synchronous - acceptable for startup)
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer configuration - store files in UPLOAD_DIR with original filename prefixed by timestamp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}-${file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

// Public routes
router.post("/", validateRequest("createOrder"), orderController.createOrder);
// Bank transfer order (multipart/form-data) - accepts a single file field named 'eReceipt'
// Bank transfer route uses Cloudinary upload middleware (in-memory upload + streaming to Cloudinary)
router.post(
  "/bank",
  ...uploadEReceipt("eReceipt"),
  orderController.createBankOrder
);
router.post(
  "/calculate-totals",
  validateRequest("calculateOrderTotals"),
  orderController.calculateOrderTotals
);
router.get(
  "/:id/tracking",
  validateRequest("orderId"),
  orderController.getOrderTracking
);

// Protected routes (would require authentication middleware)
router.get("/", validateRequest("getOrders"), orderController.getOrders);
router.get("/:id", validateRequest("orderId"), orderController.getOrderById);
router.patch(
  "/:id/status",
  validateRequest("updateOrderStatus"),
  orderController.updateOrderStatus
);
router.patch(
  "/:id/cancel",
  validateRequest("cancelOrder"),
  orderController.cancelOrder
);
router.post(
  "/:id/payment",
  validateRequest("processPayment"),
  orderController.processPayment
);

export default router;
