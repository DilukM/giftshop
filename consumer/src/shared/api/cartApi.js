// Cart API Service
// Handles all cart-related API calls

import apiService from "../services/apiService.js";
import { API_ENDPOINTS } from "../config/api.js";

export class CartApi {
  // Get current cart
  static async getCart(sessionId) {
    try {
      const headers = {};
      if (sessionId) {
        headers["x-session-id"] = sessionId;
      }
      console.log("Using session ID in headers:", headers);
      const response = await apiService.get(
        API_ENDPOINTS.CART,
        {},
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch cart:", error.message);
      throw error;
    }
  }

  // Add item to cart
  static async addItem(productId, quantity = 1, sessionId) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (sessionId) {
        headers["x-session-id"] = sessionId;
      }

      const body = {
        productId,
        quantity,
      };

      const response = await apiService.post(
        API_ENDPOINTS.CART_ADD_ITEM,
        body,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to add item to cart:", error.message);
      throw error;
    }
  }

  // Update item quantity in cart
  static async updateItem(itemId, quantity, sessionId) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (sessionId) {
        headers["x-session-id"] = sessionId;
      }
      const body = { quantity };
      const response = await apiService.put(
        API_ENDPOINTS.CART_UPDATE_ITEM(itemId),
        body,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to update cart item ${itemId}:`, error.message);
      throw error;
    }
  }

  // Remove item from cart
  static async removeItem(itemId, sessionId) {
    try {
      const headers = {};
      if (sessionId) {
        headers["x-session-id"] = sessionId;
      }
      const response = await apiService.delete(
        API_ENDPOINTS.CART_REMOVE_ITEM(itemId),
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to remove cart item ${itemId}:`, error.message);
      throw error;
    }
  }

  // Clear entire cart
  static async clearCart(sessionId) {
    console.log("🧹 [CartApi] clearCart called");
    try {
      const headers = {};
      if (sessionId) {
        headers["x-session-id"] = sessionId;
      }
      const response = await apiService.delete(API_ENDPOINTS.CART_CLEAR, {
        headers,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to clear cart:", error.message);
      throw error;
    }
  }
}

export default CartApi;
