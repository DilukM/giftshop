// Temporary simplified Product Controller that works with the current database schema
import { query } from "../../infrastructure/database/connection.js";

export class SimpleProductController {
  // Get all products with basic filtering
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        search,
        minPrice,
        maxPrice,
        sortBy = "created_at",
        featured,
      } = req.query;

      let whereConditions = ["p.is_active = true"];
      let queryParams = [];
      let paramCount = 0;

      // Handle category filtering with JSONB
      if (category) {
        whereConditions.push(`p.category_ids @> $${++paramCount}::jsonb`);
        queryParams.push(JSON.stringify([category]));
      }

      // Handle price filtering
      if (minPrice) {
        whereConditions.push(`p.price >= $${++paramCount}`);
        queryParams.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        whereConditions.push(`p.price <= $${++paramCount}`);
        queryParams.push(parseFloat(maxPrice));
      }

      // Handle search
      if (search) {
        whereConditions.push(
          `(p.name ILIKE $${++paramCount} OR p.description ILIKE $${++paramCount})`
        );
        queryParams.push(`%${search}%`, `%${search}%`);
        paramCount++; // Account for the second parameter
      }

      // Handle featured filter
      if (featured === "true") {
        whereConditions.push("p.is_featured = true");
      }

      // Sorting
      let orderBy = "p.created_at DESC";
      switch (sortBy) {
        case "price_asc":
          orderBy = "p.price ASC";
          break;
        case "price_desc":
          orderBy = "p.price DESC";
          break;
        case "name":
          orderBy = "p.name ASC";
          break;
        case "featured":
          orderBy = "p.is_featured DESC, p.created_at DESC";
          break;
      }

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        WHERE ${whereConditions.join(" AND ")}
      `;

      const dataQuery = `
        SELECT p.*
        FROM products p
        WHERE ${whereConditions.join(" AND ")}
        ORDER BY ${orderBy}
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      queryParams.push(limitNum, offset);

      const [countResult, dataResult] = await Promise.all([
        query(countQuery, queryParams.slice(0, -2)),
        query(dataQuery, queryParams),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          products: dataResult.rows,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
          },
        },
        message: "Products retrieved successfully",
      });
    } catch (error) {
      console.error("Failed to get products:", error);
      res.status(500).json({
        success: false,
        message: `Failed to get products: ${error.message}`,
      });
    }
  }

  // Get featured products
  async getFeaturedProducts(req, res) {
    try {
      const { limit = 6 } = req.query;

      const result = await query(
        `
        SELECT p.*
        FROM products p
        WHERE p.is_active = true AND p.is_featured = true
        ORDER BY p.created_at DESC
        LIMIT $1
      `,
        [parseInt(limit)]
      );

      res.json({
        success: true,
        data: {
          products: result.rows,
          total: result.rows.length,
        },
        message: "Featured products retrieved successfully",
      });
    } catch (error) {
      console.error("Failed to get featured products:", error);
      res.status(500).json({
        success: false,
        message: `Failed to get featured products: ${error.message}`,
      });
    }
  }

  // Get product by ID or slug
  async getProductById(req, res) {
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
          SELECT p.*
          FROM products p
          WHERE p.id = $1 AND p.is_active = true
        `,
          [id]
        );
      } else {
        result = await query(
          `
          SELECT p.*
          FROM products p
          WHERE p.slug = $1 AND p.is_active = true
        `,
          [id]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.json({
        success: true,
        data: {
          product: result.rows[0],
        },
        message: "Product retrieved successfully",
      });
    } catch (error) {
      console.error("Failed to get product:", error);
      res.status(500).json({
        success: false,
        message: `Failed to get product: ${error.message}`,
      });
    }
  }

  // Get product by slug (alias for compatibility)
  async getProductBySlug(req, res) {
    return this.getProductById(req, res);
  }

  // Search products
  async searchProducts(req, res) {
    try {
      const { q: searchQuery, limit = 12 } = req.query;

      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const result = await query(
        `
        SELECT p.*
        FROM products p
        WHERE p.is_active = true 
        AND (p.name ILIKE $1 OR p.description ILIKE $1 OR p.tags::text ILIKE $1)
        ORDER BY 
          CASE 
            WHEN p.name ILIKE $1 THEN 1
            WHEN p.description ILIKE $1 THEN 2
            ELSE 3
          END,
          p.is_featured DESC,
          p.created_at DESC
        LIMIT $2
      `,
        [`%${searchQuery}%`, parseInt(limit)]
      );

      res.json({
        success: true,
        data: {
          products: result.rows,
          total: result.rows.length,
          query: searchQuery,
        },
        message: "Search completed successfully",
      });
    } catch (error) {
      console.error("Failed to search products:", error);
      res.status(500).json({
        success: false,
        message: `Failed to search products: ${error.message}`,
      });
    }
  }
}
