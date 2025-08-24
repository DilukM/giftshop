import { OrderService } from "../../application/services/OrderService.js";

export class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  // Get all orders (admin) or user's orders
  getOrders = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status, userId } = req.query;
      const { orders, pagination } = await this.orderService.getOrders({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        userId,
      });

      res.json({
        success: true,
        data: orders,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get order by ID
  getOrderById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const order = await this.orderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Create new order
  createOrder = async (req, res, next) => {
    try {
      const orderData = req.body;
      const order = await this.orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Create bank transfer order (multipart/form-data expected)
  createBankOrder = async (req, res, next) => {
    try {
      // Expect shippingInfo and cartItems as JSON strings in fields
      const { shippingInfo, cartItems, transactionRef } = req.body;

      let parsedShipping = null;
      let parsedCart = null;

      // Defensive parsing: only attempt JSON.parse if the string looks like JSON
      const looksLikeJson = (s) =>
        typeof s === "string" &&
        s.trim().length > 0 &&
        (s.trim().startsWith("{") || s.trim().startsWith("["));

      try {
        if (looksLikeJson(shippingInfo)) {
          parsedShipping = JSON.parse(shippingInfo);
        } else {
          // If it's already an object or a simple string/address, use as-is
          parsedShipping = shippingInfo;
        }
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid shippingInfo JSON" });
      }

      try {
        if (looksLikeJson(cartItems)) {
          parsedCart = JSON.parse(cartItems);
        } else {
          parsedCart = cartItems;
        }
      } catch (e) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid cartItems JSON" });
      }

      // Multer attaches file metadata to req.file when upload.single('eReceipt') is used
      const fileMeta = req.file
        ? {
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
          }
        : null;

      // Derive customer and address info
      const customerInfo = parsedShipping?.customerInfo || parsedShipping || {};
      const shippingAddress =
        parsedShipping?.shippingAddress || parsedShipping?.address || {};
      const billingAddress =
        parsedShipping?.billingAddress || shippingAddress || {};

      const firstName = customerInfo.firstName || customerInfo.first_name || "";
      const lastName = customerInfo.lastName || customerInfo.last_name || "";
      const customerName =
        `${firstName} ${lastName}`.trim() ||
        parsedShipping?.customerName ||
        parsedShipping?.name ||
        "";
      const customerEmail =
        customerInfo.email ||
        customerInfo.email_address ||
        parsedShipping?.customerEmail ||
        "";
      const customerPhone =
        customerInfo.phone ||
        customerInfo.phone_number ||
        parsedShipping?.customerPhone ||
        "";

      // Build items and compute totals
      const items = Array.isArray(parsedCart)
        ? parsedCart.map((it) => ({
            productId: it.productId || it.product_id || null,
            quantity: it.quantity || 1,
            unitPrice: parseFloat(
              it.unitPrice || it.unit_price || it.price || 0
            ),
            totalPrice: parseFloat(
              it.totalPrice ||
                it.total_price ||
                (it.quantity || 1) * (it.unitPrice || it.price || 0)
            ),
          }))
        : [];

      const subtotal = items.reduce((s, i) => s + (i.totalPrice || 0), 0);
      const taxAmount = parsedShipping?.taxAmount || 0;
      const shippingCost =
        parsedShipping?.shippingAmount || parsedShipping?.shipping_cost || 0;
      const discountAmount =
        parsedShipping?.discountAmount || parsedShipping?.discount_amount || 0;
      const totalAmount =
        subtotal +
        (taxAmount || 0) +
        (shippingCost || 0) -
        (discountAmount || 0);

      // Build order payload consistent with repository expectations
      const orderPayload = {
        paymentMethod: "bank_transfer",
        transactionRef: transactionRef || null,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        billingAddress: billingAddress,
        shippingAddress: shippingAddress,
        cartItems: items,
        items: items,
        subtotal: subtotal,
        taxAmount: taxAmount,
        shippingCost: shippingCost,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        paymentStatus: "pending",
        orderStatus: "pending",
        notes: parsedShipping?.notes || null,
        eReceiptUrl: fileMeta ? fileMeta.path : null,
      };

      const order = await this.orderService.createOrder(orderPayload);

      res
        .status(201)
        .json({
          success: true,
          message: "Bank order created",
          data: { order, eReceipt: fileMeta },
        });
    } catch (error) {
      next(error);
    }
  };

  // Update order status
  updateOrderStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const order = await this.orderService.updateOrderStatus(
        id,
        status,
        notes
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Cancel order
  cancelOrder = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await this.orderService.cancelOrder(id, reason);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get order tracking info
  getOrderTracking = async (req, res, next) => {
    try {
      const { id } = req.params;
      const tracking = await this.orderService.getOrderTracking(id);

      if (!tracking) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        data: tracking,
      });
    } catch (error) {
      next(error);
    }
  };

  // Process payment
  processPayment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const paymentData = req.body;

      const result = await this.orderService.processPayment(id, paymentData);

      res.json({
        success: true,
        message: "Payment processed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Calculate order totals
  calculateOrderTotals = async (req, res, next) => {
    try {
      const { items, shippingAddress, promoCode } = req.body;

      const totals = await this.orderService.calculateOrderTotals({
        items,
        shippingAddress,
        promoCode,
      });

      res.json({
        success: true,
        data: totals,
      });
    } catch (error) {
      next(error);
    }
  };
}
