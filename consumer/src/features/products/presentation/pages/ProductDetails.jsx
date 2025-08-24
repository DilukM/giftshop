import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  Heart,
  ShoppingBag,
  ArrowLeft,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw,
  Check,
  Loader,
  AlertTriangle,
  X,
} from "lucide-react";
import { useCart } from "../../../../shared/context/CartContext";
import { ProductsApi } from "../../../../shared/api/productsApi";
import { getProductImage } from "../../../../shared/utils/imageHelpers";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart, error: cartError, clearError } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await ProductsApi.getById(id);
        setProduct(productData);
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("Product not found or failed to load.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            {error || "Product not found"}
          </h2>
          <Link to="/store" className="btn-primary">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const getProductImage = (imageUrl) => {
    // If no image URL is provided, use category-specific placeholder
    if (!imageUrl) {
      if (product.category === "teddy-bears") {
        return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80";
      } else if (product.category === "bouquets") {
        return "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80";
      } else {
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80";
      }
    }

    // Use image_url from database if available, otherwise fall back to image field
    const actualImageUrl = product.image_url || imageUrl;

    // If it's a placeholder, replace with category-specific image
    if (actualImageUrl && actualImageUrl.includes("/api/placeholder/400/400")) {
      if (product.category === "teddy-bears") {
        return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80";
      } else if (product.category === "bouquets") {
        return "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80";
      } else {
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80";
      }
    }

    return actualImageUrl || imageUrl;
  };

  const handleAddToCart = async () => {
    if (!product) {
      console.error("No product to add to cart");
      return;
    }

    if (quantity < 1) {
      console.error("Invalid quantity");
      return;
    }

    try {
      setAddingToCart(true);
      clearError(); // Clear any previous errors

      const result = await addToCart(product, quantity);

      if (result) {
        setIsAdded(true);
        // Remove the success indicator after 3 seconds
        setTimeout(() => {
          setIsAdded(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            to="/store"
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square bg-white rounded-2xl overflow-hidden shadow-luxury"
            >
              <img
                src={getProductImage(
                  product,
                  product.images?.[selectedImage] ||
                    product.image ||
                    product.image_url,
                  600
                )}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? "border-primary-600"
                        : "border-neutral-200"
                    }`}
                  >
                    <img
                      src={getProductImage(product, image, 200)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-primary-600 capitalize">
                  {product.category?.replace("-", " ")}
                </span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-neutral-600">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-primary-600">
                  Rs. {product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-neutral-400 line-through">
                    Rs. {product.originalPrice}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-lg text-sm font-medium">
                    Save Rs. {(product.originalPrice - product.price).toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-neutral-600 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Features */}
              {product.features && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                    Features
                  </h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center space-x-2 text-neutral-600"
                      >
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-neutral-700">
                    Quantity:
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={addingToCart}
                      className={`w-10 h-10 ${
                        addingToCart
                          ? "bg-neutral-50 text-neutral-300 cursor-not-allowed"
                          : "bg-neutral-100 hover:bg-neutral-200"
                      } rounded-lg flex items-center justify-center transition-colors`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={addingToCart}
                      className={`w-10 h-10 ${
                        addingToCart
                          ? "bg-neutral-50 text-neutral-300 cursor-not-allowed"
                          : "bg-neutral-100 hover:bg-neutral-200"
                      } rounded-lg flex items-center justify-center transition-colors`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {cartError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">{cartError}</span>
                    </div>
                    <button
                      onClick={clearError}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: addingToCart ? 1 : 1.02 }}
                    whileTap={{ scale: addingToCart ? 1 : 0.98 }}
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className={`flex-1 group ${
                      isAdded
                        ? "bg-green-600 hover:bg-green-700"
                        : addingToCart
                        ? "bg-primary-400 cursor-not-allowed"
                        : "bg-primary-600 hover:bg-primary-700"
                    } text-white px-8 py-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center disabled:cursor-not-allowed`}
                  >
                    {addingToCart ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : isAdded ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 bg-white border-2 border-primary-600 text-primary-600 rounded-lg flex items-center justify-center hover:bg-primary-50 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Product Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                  <Truck className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      Fast Delivery
                    </p>
                    <p className="text-xs text-neutral-600">
                      2-3 business days
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                  <Shield className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      Quality Guarantee
                    </p>
                    <p className="text-xs text-neutral-600">
                      100% satisfaction
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                  <RotateCcw className="w-6 h-6 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      Easy Returns
                    </p>
                    <p className="text-xs text-neutral-600">30-day policy</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetails;
