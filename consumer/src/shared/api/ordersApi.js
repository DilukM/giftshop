// Orders API Service
// Handles all order-related API calls

import apiService from "../services/apiService.js";
import { API_ENDPOINTS } from "../config/api.js";

export class OrdersApi {
  // Create a new order
  static async createOrder(orderData) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.CREATE_ORDER,
        orderData
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create order:", error.message);
      throw error;
    }
  }

  // Create a new bank transfer order with e-receipt upload
  static async createBankOrder({
    shippingInfo,
    cartItems,
    transactionRef,
    eReceipt,
  }) {
    try {
      const form = new FormData();

      // Attach shipping info as JSON string
      form.append("shippingInfo", JSON.stringify(shippingInfo || {}));

      // Attach cart items as JSON string
      form.append("cartItems", JSON.stringify(cartItems || []));

      // Attach transaction reference
      form.append("transactionRef", transactionRef || "");

      // Attach e-receipt if provided. eReceipt expected as { name, type, data } where data can be dataURI
      if (eReceipt && eReceipt.data) {
        // If data is a data URL, convert to blob
        let blob;
        if (
          typeof eReceipt.data === "string" &&
          eReceipt.data.startsWith("data:")
        ) {
          const res = await fetch(eReceipt.data);
          blob = await res.blob();
        } else if (eReceipt instanceof File) {
          blob = eReceipt;
        }

        if (blob) {
          form.append("eReceipt", blob, eReceipt.name || "ereceipt");
        }
      }

      const response = await apiService.post(
        API_ENDPOINTS.CREATE_ORDER_BANK,
        form,
        {
          // Let apiService detect FormData and skip JSON stringify
          headers: {},
        }
      );

      return response.data;
    } catch (error) {
      console.error("Failed to create bank order:", error.message);
      throw error;
    }
  }

  // Get order by ID
  static async getById(orderId) {
    try {
      const response = await apiService.get(API_ENDPOINTS.ORDER_BY_ID(orderId));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch order ${orderId}:`, error.message);
      throw error;
    }
  }

  // Get all orders (for authenticated users)
  static async getAll(filters = {}) {
    try {
      const response = await apiService.get(API_ENDPOINTS.ORDERS, filters);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch orders:", error.message);
      throw error;
    }
  }
}

export default OrdersApi;
