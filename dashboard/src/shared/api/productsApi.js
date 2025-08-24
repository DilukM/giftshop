import apiService from "../services/apiService";
import { API_ENDPOINTS } from "../config/api";

export class ProductsApi {
  static async getAll(filters = {}) {
    try {
      const resp = await apiService.get(
        API_ENDPOINTS.PRODUCTS + buildQuery(filters)
      );
      // assume backend returns { data: { products: [...] } } or raw array
      if (resp && resp.data && resp.data.products) return resp.data.products;
      if (Array.isArray(resp)) return resp;
      return resp.data?.data?.products || [];
    } catch (err) {
      console.error("Failed to fetch products", err);
      throw err;
    }
  }

  static async getById(id) {
    try {
      const resp = await apiService.get(API_ENDPOINTS.PRODUCT_BY_ID(id));
      return resp.data?.data?.product || resp.data || null;
    } catch (err) {
      console.error(`Failed to fetch product ${id}`, err);
      throw err;
    }
  }

  static async getFeatured(limit = 6) {
    try {
      const resp = await apiService.get(
        API_ENDPOINTS.FEATURED_PRODUCTS + `?limit=${limit}`
      );
      return resp.data?.data?.products || resp.data || [];
    } catch (err) {
      console.error("Failed to fetch featured products", err);
      throw err;
    }
  }
}

function buildQuery(params) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : "";
}

export default ProductsApi;
