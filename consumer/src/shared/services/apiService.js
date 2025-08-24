// API Service
// Centralized service for making HTTP requests to the backend

import {
  API_BASE_URL,
  API_ENDPOINTS,
  HTTP_METHODS,
  DEFAULT_HEADERS,
  REQUEST_TIMEOUT,
  HTTP_STATUS,
} from "../config/api.js";

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Base API service class
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = REQUEST_TIMEOUT;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Default configuration
    const config = {
      method: options.method || HTTP_METHODS.GET,
      headers: {
        "Content-Type": "application/json",
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
      ...options,
    };

    // Add body for POST, PUT, PATCH requests
    if (
      config.body &&
      (config.method === HTTP_METHODS.POST ||
        config.method === HTTP_METHODS.PUT ||
        config.method === HTTP_METHODS.PATCH)
    ) {
      // If body is FormData, don't stringify and let fetch set headers
      if (config.body instanceof FormData) {
        // remove Content-Type to allow multipart/form-data with boundary
        if (config.headers && config.headers["Content-Type"]) {
          delete config.headers["Content-Type"];
        }
      } else {
        // Warn if body is a string (should be a plain object)
        if (typeof config.body === "string") {
          console.warn(
            "⚠️ API Service: Body is a string. This will cause Content-Type to be text/plain. Pass a plain object instead.",
            config.body
          );
        }
        console.log("🔍 Before JSON.stringify - config.body:", config.body);
        config.body = JSON.stringify(config.body);
        console.log("🔍 After JSON.stringify - config.body:", config.body);
      }
    } else {
      console.log(
        "🔍 No body or wrong method - config.body:",
        config.body,
        "method:",
        config.method
      );
    }

    try {
      console.log(`🌐 API Request: ${config.method} ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Log response status
      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const errorMessage =
          data.message ||
          data.error ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMessage, response.status, data);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("❌ Request timeout");
        throw new ApiError("Request timeout", HTTP_STATUS.SERVICE_UNAVAILABLE);
      }

      if (error instanceof ApiError) {
        console.error(`❌ API Error: ${error.message}`);
        throw error;
      }

      console.error("❌ Network Error:", error.message);
      throw new ApiError(
        "Network error occurred",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        error
      );
    }
  }

  // GET request
  async get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: HTTP_METHODS.GET,
      ...options,
    });
  }

  // POST request
  async post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: HTTP_METHODS.POST,
      body,
      ...options,
    });
  }

  // PUT request
  async put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: HTTP_METHODS.PUT,
      body,
      ...options,
    });
  }

  // PATCH request
  async patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: HTTP_METHODS.PATCH,
      body,
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: HTTP_METHODS.DELETE,
      ...options,
    });
  }

  // Update base URL (useful for switching environments)
  setBaseURL(newBaseURL) {
    this.baseURL = newBaseURL;
    console.log(`🔄 API Base URL updated to: ${newBaseURL}`);
  }

  // Get current base URL
  getBaseURL() {
    return this.baseURL;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
  get,
  post,
  put,
  patch,
  delete: del,
  setBaseURL,
  getBaseURL,
} = apiService;
