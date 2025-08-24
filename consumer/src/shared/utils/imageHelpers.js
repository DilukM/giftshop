// Utility functions for image handling
// Provides consistent placeholder images across the application

// Default placeholder images for different categories
const PLACEHOLDER_IMAGES = {
  "teddy-bears":
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
  bouquets:
    "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
  default:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
};

/**
 * Gets the appropriate product image, handling missing images with category-specific placeholders
 * @param {Object} product - The product object
 * @param {string} imageUrl - Optional specific image URL to use
 * @param {number} width - Optional width for the image (default: 600)
 * @returns {string} - The image URL to use
 */
export const getProductImage = (product, imageUrl = null, width = 600) => {
  // Use provided imageUrl or fallback to product's image fields
  const targetImageUrl = imageUrl || product?.image_url || product?.image;

  // If no image is available at all, use category-specific placeholder
  if (!targetImageUrl) {
    const categoryImage =
      PLACEHOLDER_IMAGES[product?.category] || PLACEHOLDER_IMAGES.default;
    return categoryImage.replace("w=600", `w=${width}`);
  }

  // If the image is a placeholder URL, replace with category-specific image
  if (
    targetImageUrl.includes("/api/placeholder/400/400") ||
    targetImageUrl.includes("placeholder") ||
    targetImageUrl.startsWith("http://placeholder.it") ||
    targetImageUrl.startsWith("https://via.placeholder.com")
  ) {
    const categoryImage =
      PLACEHOLDER_IMAGES[product?.category] || PLACEHOLDER_IMAGES.default;
    return categoryImage.replace("w=600", `w=${width}`);
  }

  return targetImageUrl;
};

/**
 * Gets placeholder image for a specific category
 * @param {string} category - The product category
 * @param {number} width - Optional width for the image (default: 600)
 * @returns {string} - The placeholder image URL
 */
export const getCategoryPlaceholder = (category, width = 600) => {
  const categoryImage =
    PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.default;
  return categoryImage.replace("w=600", `w=${width}`);
};

/**
 * Validates if an image URL is likely to be valid
 * @param {string} imageUrl - The image URL to validate
 * @returns {boolean} - Whether the URL appears valid
 */
export const isValidImageUrl = (imageUrl) => {
  if (!imageUrl) return false;

  // Check for common placeholder patterns
  const placeholderPatterns = [
    "/api/placeholder/",
    "placeholder.it",
    "via.placeholder.com",
    "placeholder.com",
    "placehold",
    "example.com/image",
  ];

  return !placeholderPatterns.some((pattern) =>
    imageUrl.toLowerCase().includes(pattern)
  );
};

export default {
  getProductImage,
  getCategoryPlaceholder,
  isValidImageUrl,
  PLACEHOLDER_IMAGES,
};
