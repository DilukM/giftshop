// Shared exports
export { default as Navbar } from "./components/Navbar.jsx";
export { default as Footer } from "./components/Footer.jsx";
export { CartProvider, useCart } from "./context/CartContext.jsx";
export { colors } from "./styles/colors.js";
export * as helpers from "./utils/helpers.js";

// API exports
export { default as API } from "./api/index.js";
export {
  ProductsApi,
  CategoriesApi,
  CartApi,
  OrdersApi,
  ContactApi,
  apiService,
  ApiError,
} from "./api/index.js";

// Custom hooks
export { useApi, useApiCall, useApiForm } from "./hooks/useApi.js";
