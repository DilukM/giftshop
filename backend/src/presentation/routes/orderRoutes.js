import express from "express";
import { OrderController } from "../controllers/OrderController.js";
import { validateRequest } from "../middleware/validation.js";
import { uploadEReceipt } from "../middleware/cloudinaryUpload.js";

const router = express.Router();
const orderController = new OrderController();

// NOTE: Local filesystem uploads were removed — uploads are handled in-memory
// and streamed directly to Cloudinary by the `uploadEReceipt` middleware.

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
