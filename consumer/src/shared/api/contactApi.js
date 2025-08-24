// Contact API Service
// Handles contact form submissions

import apiService from "../services/apiService.js";
import { API_ENDPOINTS } from "../config/api.js";

export class ContactApi {
  // Submit contact form
  static async submitContactForm(contactData) {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.CONTACT,
        contactData
      );
      return response.data;
    } catch (error) {
      console.error("Failed to submit contact form:", error.message);
      throw error;
    }
  }
}

export default ContactApi;
