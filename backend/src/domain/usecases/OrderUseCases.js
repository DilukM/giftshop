export class OrderUseCases {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async createOrder(orderData) {
    try {
      return await this.orderRepository.create(orderData);
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderById(id) {
    try {
      return await this.orderRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }

  async getOrdersByUserId(userId) {
    try {
      return await this.orderRepository.findByUserId(userId);
    } catch (error) {
      throw new Error(`Failed to get user orders: ${error.message}`);
    }
  }

  async updateOrderStatus(id, status) {
    try {
      return await this.orderRepository.updateStatus(id, status);
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  async getAllOrders() {
    try {
      return await this.orderRepository.findAll();
    } catch (error) {
      throw new Error(`Failed to get all orders: ${error.message}`);
    }
  }

  async deleteOrder(id) {
    try {
      return await this.orderRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete order: ${error.message}`);
    }
  }
}
