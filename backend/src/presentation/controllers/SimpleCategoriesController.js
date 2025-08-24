// Simple Categories Controller
import { query } from "../../infrastructure/database/connection.js";

export class SimpleCategoriesController {
  // Get all categories
  async getCategories(req, res) {
    try {
      const result = await query(`
        SELECT 
          id,
          name,
          slug,
          description,
          image_url,
          is_active,
          sort_order
        FROM categories 
        WHERE is_active = true
        ORDER BY sort_order ASC, name ASC
      `);

      res.json({
        success: true,
        data: {
          categories: result.rows,
          total: result.rows.length,
        },
        message: "Categories retrieved successfully",
      });
    } catch (error) {
      console.error("Failed to get categories:", error);
      res.status(500).json({
        success: false,
        message: `Failed to get categories: ${error.message}`,
      });
    }
  }

  // Get category by ID or slug
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;

      let result;
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id
        );

      if (isUUID) {
        result = await query(
          `
          SELECT *
          FROM categories
          WHERE id = $1 AND is_active = true
        `,
          [id]
        );
      } else {
        result = await query(
          `
          SELECT *
          FROM categories
          WHERE slug = $1 AND is_active = true
        `,
          [id]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      res.json({
        success: true,
        data: {
          category: result.rows[0],
        },
        message: "Category retrieved successfully",
      });
    } catch (error) {
      console.error("Failed to get category:", error);
      res.status(500).json({
        success: false,
        message: `Failed to get category: ${error.message}`,
      });
    }
  }
}
