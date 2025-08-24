import { OrderRepository } from "../interfaces/OrderRepository.js";
import { Order } from "../../domain/entities/Order.js";
import { OrderItem } from "../../domain/entities/OrderItem.js";
import { pool } from "../database/connection.js";

export class PostgresOrderRepository extends OrderRepository {
  async create(orderData) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert order
      const orderQuery = `
        INSERT INTO orders (
          customer_name, customer_email, customer_phone,
          billing_address, shipping_address, payment_method,
          e_receipt_url, payment_status, order_status, notes, subtotal,
          tax_amount, shipping_cost, discount_amount, total_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const orderValues = [
        orderData.customerName,
        orderData.customerEmail,
        orderData.customerPhone,
        JSON.stringify(orderData.billingAddress),
        JSON.stringify(orderData.shippingAddress),
        orderData.paymentMethod,
        orderData.eReceiptUrl || null,
        orderData.paymentStatus,
        orderData.orderStatus,
        orderData.notes,
        orderData.subtotal,
        orderData.taxAmount,
        orderData.shippingCost,
        orderData.discountAmount,
        orderData.totalAmount,
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      // Insert order items (support items or cartItems)
      const orderItems = [];
      const itemsSource = Array.isArray(orderData.items)
        ? orderData.items
        : Array.isArray(orderData.cartItems)
        ? orderData.cartItems
        : [];
      for (const item of itemsSource) {
        // Normalize product id and pricing
        const productId = item.productId || item.product_id || null;
        const quantity = item.quantity || 1;
        const unitPrice = parseFloat(
          item.unitPrice || item.unit_price || item.price || 0
        );
        const totalPrice = parseFloat(
          item.totalPrice || item.total_price || quantity * unitPrice || 0
        );

        // Try to get product display fields from the incoming item
        let productName =
          item.productName ||
          item.product_name ||
          (item.product && (item.product.name || item.product.title)) ||
          null;
        let productSlug =
          item.productSlug ||
          item.product_slug ||
          (item.product && item.product.slug) ||
          null;
        let productImage =
          item.productImageUrl ||
          item.product_image_url ||
          (item.product && (item.product.image_url || item.product.image)) ||
          null;

        // If any display field is missing but we have a productId, fetch from products table
        if ((!productName || !productSlug) && productId) {
          const prodRes = await client.query(
            `SELECT name, slug, image_url FROM products WHERE id = $1`,
            [productId]
          );
          if (prodRes.rows[0]) {
            productName = productName || prodRes.rows[0].name;
            productSlug = productSlug || prodRes.rows[0].slug;
            productImage = productImage || prodRes.rows[0].image_url;
          }
        }

        const itemQuery = `
          INSERT INTO order_items (
            order_id, product_id, product_name, product_slug, product_image_url, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        const itemValues = [
          order.id,
          productId,
          productName,
          productSlug,
          productImage,
          quantity,
          unitPrice,
          totalPrice,
        ];

        const itemResult = await client.query(itemQuery, itemValues);
        orderItems.push(itemResult.rows[0]);
      }

      await client.query("COMMIT");

      return this._mapToOrder({ ...order, order_items: orderItems });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const query = `
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price,
                 'product', json_build_object(
                   'id', p.id,
                   'name', p.name,
                   'slug', p.slug,
                   'image_url', p.image_url
                 )
               )
             ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id
    `;

    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? this._mapToOrder(result.rows[0]) : null;
  }

  async findAll({ page, limit, status, userId, startDate, endDate } = {}) {
    let query = `
      SELECT o.*, 
             json_agg(
               json_build_object(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'total_price', oi.total_price
               )
             ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;

    const values = [];
    let valueIndex = 1;

    if (status) {
      query += ` AND o.order_status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    if (userId) {
      query += ` AND o.user_id = $${valueIndex}`;
      values.push(userId);
      valueIndex++;
    }

    if (startDate) {
      query += ` AND o.created_at >= $${valueIndex}`;
      values.push(startDate);
      valueIndex++;
    }

    if (endDate) {
      query += ` AND o.created_at <= $${valueIndex}`;
      values.push(endDate);
      valueIndex++;
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

    if (limit) {
      query += ` LIMIT $${valueIndex}`;
      values.push(limit);
      valueIndex++;

      if (page) {
        const offset = (page - 1) * limit;
        query += ` OFFSET $${valueIndex}`;
        values.push(offset);
      }
    }

    const result = await pool.query(query, values);
    return result.rows.map((row) => this._mapToOrder(row));
  }

  async update(id, updateData) {
    const fields = [];
    const values = [];
    let valueIndex = 1;

    if (updateData.orderStatus !== undefined) {
      fields.push(`order_status = $${valueIndex}`);
      values.push(updateData.orderStatus);
      valueIndex++;
    }

    if (updateData.paymentStatus !== undefined) {
      fields.push(`payment_status = $${valueIndex}`);
      values.push(updateData.paymentStatus);
      valueIndex++;
    }

    if (updateData.notes !== undefined) {
      fields.push(`notes = $${valueIndex}`);
      values.push(updateData.notes);
      valueIndex++;
    }

    if (updateData.trackingNumber !== undefined) {
      fields.push(`tracking_number = $${valueIndex}`);
      values.push(updateData.trackingNumber);
      valueIndex++;
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE orders 
      SET ${fields.join(", ")}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    values.push(id);

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? this._mapToOrder(result.rows[0]) : null;
  }

  async delete(id) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Delete order items first
      await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);

      // Delete order
      const result = await client.query(
        "DELETE FROM orders WHERE id = $1 RETURNING *",
        [id]
      );

      await client.query("COMMIT");

      return result.rowCount > 0;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrderStatistics(period = "30d") {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period.replace(
        "d",
        " days"
      )}'
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }

  _mapToOrder(row) {
    const orderItems =
      row.order_items && row.order_items[0].id
        ? row.order_items.map(
            (item) =>
              new OrderItem({
                id: item.id,
                productId: item.product_id,
                quantity: item.quantity,
                unitPrice: parseFloat(item.unit_price),
                totalPrice: parseFloat(item.total_price),
                product: item.product,
              })
          )
        : [];

    return new Order({
      id: row.id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      billingAddress: (() => {
        const raw = row.billing_address;
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw);
          } catch (e) {
            // Not valid JSON — return the raw string so caller can handle it
            return raw;
          }
        }
        return raw;
      })(),
      shippingAddress: (() => {
        const raw = row.shipping_address;
        if (typeof raw === "string") {
          try {
            return JSON.parse(raw);
          } catch (e) {
            return raw;
          }
        }
        return raw;
      })(),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      orderStatus: row.order_status,
      notes: row.notes,
      trackingNumber: row.tracking_number,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      shippingCost: parseFloat(row.shipping_cost),
      discountAmount: parseFloat(row.discount_amount),
      totalAmount: parseFloat(row.total_amount),
      items: orderItems,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
