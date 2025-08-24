import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Truck,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useCart } from "../../../../shared/context/CartContext";
import { OrdersApi } from "../../../../shared/api/ordersApi";

const CheckoutBankTransfer = () => {
  const { cart, summary, processCheckout, clearError, error } = useCart();
  const [reference, setReference] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [eReceiptFile, setEReceiptFile] = useState(null);
  const [eReceiptPreview, setEReceiptPreview] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    addressLine2: "",
    contactNumber: "",
    city: "",
    zip: "",
  });
  const [shippingErrors, setShippingErrors] = useState({});

  const handleConfirm = async () => {
    setSubmitting(true);
    clearError();
    try {
      const payload = {
        paymentMethod: "bank_transfer",
        reference,
        transactionRef,
        eReceipt: eReceiptFile
          ? {
              name: eReceiptFile.name,
              type: eReceiptFile.type,
              data: eReceiptFile.data,
            }
          : null,
      };

      const result = await processCheckout(payload);
      if (result?.success) {
        setSuccess(true);
      } else {
        // processCheckout should set error in context
        setSuccess(false);
      }
    } catch (err) {
      console.error("Bank transfer checkout failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate a unique transaction reference
  const generateTransactionRef = () => {
    // Generate a random 10-digit numeric string (1000000000 - 9999999999)
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  useEffect(() => {
    const tx = generateTransactionRef();
    setTransactionRef(tx);
    // pre-fill the reference input so the user can copy/paste or leave as-is
    setReference(tx);
  }, []);

  const copyToClipboard = async (text) => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // fallback: select and execCommand not necessary here
      console.warn("Copy failed", err);
    }
  };

  const handleFileChange = (e) => {
    setFileError(null);
    // Accept either an input event or a File object
    const file = e?.target?.files?.[0] || (e instanceof File ? e : null);
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setFileError("Unsupported file type. Please upload a PDF or image.");
      return;
    }

    if (file.size > maxSize) {
      setFileError("File is too large. Max size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEReceiptFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result,
      });
      if (file.type.startsWith("image/")) setEReceiptPreview(reader.result);
      else setEReceiptPreview(null);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setEReceiptFile(null);
    setEReceiptPreview(null);
    setFileError(null);
    // reset input value if needed - input DOM reset handled via key change below if added
  };

  const subtotal = summary?.subtotal || 0;
  const shipping = 350;
  const tax = 0;
  const total = subtotal + shipping + tax;

  // Handler for placing bank transfer order
  const handlePlaceOrder = async () => {
    // Validate shipping form first
    if (!validateShipping()) return;
    if (!validateFile()) return;

    // Build shippingInfo and cartItems from cart/summary
    setSubmitting(true);
    clearError();
    try {
      const shippingInfo = {
        // include collected shipping fields
        firstName: shippingForm.firstName,
        lastName: shippingForm.lastName,
        email: shippingForm.email,
        address: shippingForm.address,
        addressLine2: shippingForm.addressLine2,
        contactNumber: shippingForm.contactNumber,
        city: shippingForm.city,
        zip: shippingForm.zip,
        shippingAmount: shipping,
      };

      const cartItems =
        cart?.items?.map((it) => ({
          productId: it.product.id,
          name: it.product.name,
          price: it.product.price,
          quantity: it.quantity,
        })) || [];

      const eReceiptPayload = eReceiptFile ? { ...eReceiptFile } : null;

      const result = await OrdersApi.createBankOrder({
        shippingInfo,
        cartItems,
        transactionRef,
        eReceipt: eReceiptPayload,
      });

      // Handle success (navigate, show toast, clear cart, etc.)
      console.log("Bank order created:", result);
      setSuccess(true);
    } catch (err) {
      console.error("Place order failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const validateShipping = () => {
    const errs = {};
    if (!shippingForm.firstName.trim())
      errs.firstName = "First name is required";
    if (!shippingForm.lastName.trim()) errs.lastName = "Last name is required";
    if (!shippingForm.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingForm.email))
      errs.email = "Please enter a valid email";
    if (!shippingForm.address.trim()) errs.address = "Address is required";
    // contact number validation: required and simple numeric check
    if (!shippingForm.contactNumber.trim())
      errs.contactNumber = "Contact number is required";
    else if (!/^\+?[0-9\s-]{7,15}$/.test(shippingForm.contactNumber))
      errs.contactNumber = "Please enter a valid contact number";
    if (!shippingForm.city.trim()) errs.city = "City is required";
    if (!shippingForm.zip.trim()) errs.zip = "ZIP code is required";

    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateFile = () => {
    // Require e-receipt upload
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!eReceiptFile) {
      setFileError("Please upload an e-receipt (PDF or image).");
      return false;
    }

    if (!allowedTypes.includes(eReceiptFile.type)) {
      setFileError("Unsupported file type. Please upload a PDF or image.");
      return false;
    }

    if (eReceiptFile.size > maxSize) {
      setFileError("File is too large. Max size is 5MB.");
      return false;
    }

    setFileError(null);
    return true;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50 pt-20"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Checkout</h1>
            <p className="text-xl text-white/90">
              Complete your graduation gift order
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Cart */}
        <Link
          to="/cart"
          className="flex items-center text-primary-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-primary-600" />
                Shipping Information
              </h2>

              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={shippingForm.firstName}
                      onChange={(e) =>
                        setShippingForm({
                          ...shippingForm,
                          firstName: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        shippingErrors.firstName
                          ? "border-red-400"
                          : "border-neutral-200"
                      }`}
                      placeholder="John"
                    />
                    {shippingErrors.firstName && (
                      <div className="text-red-600 text-sm mt-1">
                        {shippingErrors.firstName}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={shippingForm.lastName}
                      onChange={(e) =>
                        setShippingForm({
                          ...shippingForm,
                          lastName: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        shippingErrors.lastName
                          ? "border-red-400"
                          : "border-neutral-200"
                      }`}
                      placeholder="Doe"
                    />
                    {shippingErrors.lastName && (
                      <div className="text-red-600 text-sm mt-1">
                        {shippingErrors.lastName}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={shippingForm.email}
                    onChange={(e) =>
                      setShippingForm({
                        ...shippingForm,
                        email: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      shippingErrors.email
                        ? "border-red-400"
                        : "border-neutral-200"
                    }`}
                    placeholder="john@example.com"
                  />
                  {shippingErrors.email && (
                    <div className="text-red-600 text-sm mt-1">
                      {shippingErrors.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={shippingForm.address}
                    onChange={(e) =>
                      setShippingForm({
                        ...shippingForm,
                        address: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      shippingErrors.address
                        ? "border-red-400"
                        : "border-neutral-200"
                    }`}
                    placeholder="123 Main Street"
                  />
                  {shippingErrors.address && (
                    <div className="text-red-600 text-sm mt-1">
                      {shippingErrors.address}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address Line 2 (optional)
                  </label>
                  <input
                    type="text"
                    value={shippingForm.addressLine2}
                    onChange={(e) =>
                      setShippingForm({
                        ...shippingForm,
                        addressLine2: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={shippingForm.contactNumber}
                    onChange={(e) =>
                      setShippingForm({
                        ...shippingForm,
                        contactNumber: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      shippingErrors.contactNumber
                        ? "border-red-400"
                        : "border-neutral-200"
                    }`}
                    placeholder="0712345678"
                  />
                  {shippingErrors.contactNumber && (
                    <div className="text-red-600 text-sm mt-1">
                      {shippingErrors.contactNumber}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingForm.city}
                      onChange={(e) =>
                        setShippingForm({
                          ...shippingForm,
                          city: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        shippingErrors.city
                          ? "border-red-400"
                          : "border-neutral-200"
                      }`}
                      placeholder="New York"
                    />
                    {shippingErrors.city && (
                      <div className="text-red-600 text-sm mt-1">
                        {shippingErrors.city}
                      </div>
                    )}
                  </div>
                  {/* State field removed as requested */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={shippingForm.zip}
                      onChange={(e) =>
                        setShippingForm({
                          ...shippingForm,
                          zip: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        shippingErrors.zip
                          ? "border-red-400"
                          : "border-neutral-200"
                      }`}
                      placeholder="10001"
                    />
                    {shippingErrors.zip && (
                      <div className="text-red-600 text-sm mt-1">
                        {shippingErrors.zip}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>

            {/* Validation logic */}
            {/* validateShipping function */}
            <script></script>

            {/* Bank Transfer Form */}
            <div className=" bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Bank Transfer Instructions
              </h2>

              <div className="text-neutral-600 mb-4">
                <p className="mb-2 font-medium">How to pay (quick steps):</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Copy the generated 10-digit reference shown below.</li>
                  <li>
                    When making the bank transfer or using a payment app, paste
                    that reference into the payment field (Reference / Remarks /
                    Purpose).
                  </li>
                  <li>Complete the transfer.</li>
                  <li>
                    Upload the e-receipt below (PDF or image) so we can verify
                    the payment.
                  </li>
                  <li>
                    Click the "Place Order" button in the order summary to
                    submit your order for processing.
                  </li>
                </ol>
              </div>

              <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Account Details</h3>
                <div className="text-sm text-neutral-700 space-y-1">
                  <div>Bank: First National Bank</div>
                  <div>Account Name: GiftBloom Ltd.</div>
                  <div>Account Number: 123456789</div>
                  <div>Branch Code: 1100</div>
                  <div>SWIFT: FNBSLKLX</div>
                  <div>Currency: LKR</div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Generated Transaction Reference */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Transaction Reference
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-2 bg-neutral-100 rounded-lg flex-1 text-sm break-all">
                      {transactionRef}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transactionRef)}
                      title="Copy reference"
                      className="p-2 bg-neutral-50 border rounded-lg hover:bg-neutral-100"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const t = generateTransactionRef();
                        setTransactionRef(t);
                        setReference(t);
                      }}
                      title="Regenerate"
                      className="p-2 bg-neutral-50 border rounded-lg hover:bg-neutral-100"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Paste this 10-digit reference into your bank/payment app's
                    Reference, Remarks or Purpose field so we can match your
                    payment.
                  </p>
                </div>

                {/* E-receipt upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Upload e-receipt (PDF or image, max 5MB)
                  </label>
                  {/* Dropzone component */}
                  <div
                    onClick={() =>
                      document.getElementById("ereceipt-upload").click()
                    }
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFileChange(f);
                    }}
                    className={`border-dashed border-2 rounded-lg p-6 text-center cursor-pointer ${
                      isDragging
                        ? "border-red-400 bg-red-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <div className="text-neutral-500">
                        Drag & drop here, or click to browse
                      </div>
                    </div>
                  </div>
                  <input
                    id="ereceipt-upload"
                    onChange={handleFileChange}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                  />
                  {fileError && (
                    <div className="text-red-600 text-sm mt-2">{fileError}</div>
                  )}

                  {eReceiptPreview ? (
                    <div className="mt-3 flex items-start space-x-3">
                      <img
                        src={eReceiptPreview}
                        alt="receipt preview"
                        className="w-24 h-24 object-cover rounded-md border"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {eReceiptFile?.name}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {(eReceiptFile?.size / 1024).toFixed(0)} KB
                        </div>
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() =>
                              copyToClipboard(eReceiptFile?.name || "")
                            }
                            className="px-3 py-1 bg-neutral-100 rounded"
                          >
                            Copy name
                          </button>
                          <button
                            onClick={removeFile}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : eReceiptFile ? (
                    <div className="mt-3 flex items-center justify-between bg-neutral-50 p-3 rounded">
                      <div>
                        <div className="text-sm font-medium">
                          {eReceiptFile.name}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {(eReceiptFile.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(eReceiptFile.name)}
                          className="px-3 py-1 bg-neutral-100 rounded"
                        >
                          Copy name
                        </button>
                        <button
                          onClick={removeFile}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                <div className="flex items-center">
                  <Link
                    to="/contact"
                    className="text-sm text-neutral-600 hover:text-primary-600"
                  >
                    Need help? Contact us
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-8 sticky top-24"
            >
              <h2 className="text-xl font-bold text-neutral-900 mb-6">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart?.items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center space-x-4"
                  >
                    <img
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-900 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-neutral-900">
                      Rs. {(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? "Free" : `Rs. ${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Tax</span>
                  <span>Rs. {tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold text-neutral-900">
                  <span>Total</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlaceOrder}
                disabled={submitting}
                className={`w-full btn-primary group mb-4 ${
                  submitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <Lock className="w-5 h-5 mr-2" />
                {submitting ? "Placing order..." : "Place Order"}
              </motion.button>

              {/* Security Badge */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
                  <Lock className="w-4 h-4" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckoutBankTransfer;
