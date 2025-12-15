import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total revenue
    const totalRevenue = await this.orderModel.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Monthly revenue
    const monthlyRevenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $in: ['delivered', 'shipped'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Last month revenue for comparison
    const lastMonthRevenue = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          status: { $in: ['delivered', 'shipped'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Total orders
    const totalOrders = await this.orderModel.countDocuments();
    const monthlyOrders = await this.orderModel.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const lastMonthOrders = await this.orderModel.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    // Total customers
    const totalCustomers = await this.userModel.countDocuments({ role: 'user' });
    const monthlyNewCustomers = await this.userModel.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth },
    });
    const lastMonthNewCustomers = await this.userModel.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    // Total products
    const totalProducts = await this.productModel.countDocuments();
    const lowStockProducts = await this.productModel.countDocuments({
      stock: { $lte: 10 },
    });

    // Calculate growth percentages
    const revenueGrowth = this.calculateGrowth(
      monthlyRevenue[0]?.total || 0,
      lastMonthRevenue[0]?.total || 0,
    );
    const ordersGrowth = this.calculateGrowth(monthlyOrders, lastMonthOrders);
    const customersGrowth = this.calculateGrowth(monthlyNewCustomers, lastMonthNewCustomers);

    return {
      revenue: {
        total: totalRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0,
        growth: revenueGrowth,
      },
      orders: {
        total: totalOrders,
        monthly: monthlyOrders,
        growth: ordersGrowth,
      },
      customers: {
        total: totalCustomers,
        monthly: monthlyNewCustomers,
        growth: customersGrowth,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
    };
  }

  async getSalesChart(period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;
    let groupBy: any;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
    }

    const salesData = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['delivered', 'shipped'] },
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    return salesData.map((item) => ({
      date: this.formatDate(item._id, period),
      revenue: item.revenue,
      orders: item.orders,
    }));
  }

  async getTopProducts(limit = 10) {
    return this.orderModel.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          title: { $first: '$items.title' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);
  }

  async getCategoryStats() {
    return this.orderModel.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
  }

  async getCustomerStats() {
    const topCustomers = await this.orderModel.aggregate([
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: '$userInfo.name',
          email: '$userInfo.email',
          totalOrders: 1,
          totalSpent: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    const customerSegments = await this.orderModel.aggregate([
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 100, 500, 1000, 5000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalSpent' },
          },
        },
      },
    ]);

    return {
      topCustomers,
      segments: customerSegments,
    };
  }

  async getOrderStatusStats() {
    return this.orderModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$total' },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  async getRecentActivity(limit = 20) {
    const recentOrders = await this.orderModel
      .find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('orderNumber total status createdAt user');

    const recentUsers = await this.userModel
      .find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt');

    return {
      orders: recentOrders,
      users: recentUsers,
    };
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private formatDate(dateObj: any, period: string): string {
    if (period === 'year') {
      return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}`;
    }
    return `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`;
  }
}