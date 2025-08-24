// Products API Service
// Handles all product-related API calls

import apiService from "../services/apiService.js";
import { API_ENDPOINTS } from "../config/api.js";

export class ProductsApi {
  // Get all products with optional filters
  static async getAll(filters = {}) {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRODUCTS, filters);
      return response.data.data?.products || [];
    } catch (error) {
      console.error("Failed to fetch products:", error.message);
      throw error;
    }
  }

  // Get product by ID
  static async getById(id) {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRODUCT_BY_ID(id));
      return response.data.data?.product || null;
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error.message);
      throw error;
    }
  }

  // Get featured products
  static async getFeatured(limit = 6) {
    try {
      const response = await apiService.get(API_ENDPOINTS.FEATURED_PRODUCTS, {
        limit,
      });
      return response.data.data?.products || [];
    } catch (error) {
      console.error("Failed to fetch featured products:", error.message);
      throw error;
    }
  }

  // Search products
  static async search(query, filters = {}) {
    try {
      const searchParams = { search: query, ...filters };
      const response = await apiService.get(
        API_ENDPOINTS.SEARCH_PRODUCTS,
        searchParams
      );
      return response.data.data?.products || [];
    } catch (error) {
      console.error(`Failed to search products for "${query}":`, error.message);
      throw error;
    }
  }
}

export default ProductsApi;
