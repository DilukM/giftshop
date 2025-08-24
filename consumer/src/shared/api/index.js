// API Index
// Central export point for all API services

// Import all API services
import ProductsApi from "./productsApi.js";
import CategoriesApi from "./categoriesApi.js";
import CartApi from "./cartApi.js";
import OrdersApi from "./ordersApi.js";
import ContactApi from "./contactApi.js";

// Import API service utilities
import apiService, { ApiError } from "../services/apiService.js";
import apiConfig from "../config/api.js";

// Export all API services
export {
  ProductsApi,
  CategoriesApi,
  CartApi,
  OrdersApi,
  ContactApi,
  apiService,
  ApiError,
  apiConfig,
};

// Default export with all APIs organized
export default {
  products: ProductsApi,
  categories: CategoriesApi,
  cart: CartApi,
  orders: OrdersApi,
  contact: ContactApi,
  service: apiService,
  config: apiConfig,
  ApiError,
};
