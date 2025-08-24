// Simple categories routes
import express from "express";
import { SimpleCategoriesController } from "../controllers/SimpleCategoriesController.js";

const router = express.Router();
const categoriesController = new SimpleCategoriesController();

router.get("/", (req, res) => categoriesController.getCategories(req, res));
router.get("/:id", (req, res) =>
  categoriesController.getCategoryById(req, res)
);

export default router;
