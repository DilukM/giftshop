// API Configuration
// Centralized configuration for API endpoints and settings

// Base URL for the backend API
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// API Endpoints
export const API_ENDPOINTS = {
  // Products
  PRODUCTS: "/products",
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  FEATURED_PRODUCTS: "/products/featured",
  SEARCH_PRODUCTS: "/products/search",

  // Categories
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id) => `/categories/${id}`,

  // Cart
  CART: "/cart",
  CART_ITEMS: "/cart/items",
  CART_ADD_ITEM: "/cart/items",
  CART_UPDATE_ITEM: (itemId) => `/cart/items/${itemId}`,
  CART_REMOVE_ITEM: (itemId) => `/cart/items/${itemId}`,
  CART_CLEAR: "/cart",

  // Orders
  ORDERS: "/orders",
  ORDER_BY_ID: (id) => `/orders/${id}`,
  CREATE_ORDER_BANK: "/orders/bank",
  CREATE_ORDER: "/orders",

  // Contact
  CONTACT: "/contact",

  // Health & Status
  HEALTH: "/health",
  STATUS: "/",
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
};

// Request configuration defaults
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Timeout settings
export const REQUEST_TIMEOUT = 10000; // 10 seconds

// API Response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  HTTP_METHODS,
  DEFAULT_HEADERS,
  REQUEST_TIMEOUT,
  HTTP_STATUS,
};
