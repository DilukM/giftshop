// Categories API Service
// Handles all category-related API calls

import apiService from "../services/apiService.js";
import { API_ENDPOINTS } from "../config/api.js";

export class CategoriesApi {
  // Get all categories
  static async getAll() {
    try {
      const response = await apiService.get(API_ENDPOINTS.CATEGORIES);
      return response.data.data?.categories || [];
    } catch (error) {
      console.error("Failed to fetch categories:", error.message);
      throw error;
    }
  }

  // Get category by ID
  static async getById(id) {
    try {
      const response = await apiService.get(API_ENDPOINTS.CATEGORY_BY_ID(id));
      return response.data.data?.category || null;
    } catch (error) {
      console.error(`Failed to fetch category ${id}:`, error.message);
      throw error;
    }
  }
}

export default CategoriesApi;
