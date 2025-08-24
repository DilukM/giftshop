// Simplified product routes that work with current database schema
import express from "express";
import { SimpleProductController } from "../controllers/SimpleProductController.js";

const router = express.Router();
const productController = new SimpleProductController();

// Public routes
router.get("/", (req, res) => productController.getProducts(req, res));
router.get("/featured", (req, res) =>
  productController.getFeaturedProducts(req, res)
);
router.get("/search", (req, res) => productController.searchProducts(req, res));

// Product by ID or slug - this should be last to avoid conflicts
router.get("/:id", (req, res) => productController.getProductById(req, res));

export default router;
