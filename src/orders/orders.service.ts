import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel('Order') private orderModel: Model<OrderDocument>,
        private cartService: CartService,
        private productsService: ProductsService,
    ) { }

    async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
        // Get user's cart
        const cart = await this.cartService.getCart(userId);

        if (!cart.items || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // Prepare order items with product snapshots
        const orderItems = await Promise.all(
            cart.items.map(async (item: any) => {
                const product = await this.productsService.findOne(item.product._id || item.product);

                // Verify stock
                if (product.stock < item.quantity) {
                    throw new BadRequestException(`Insufficient stock for ${product.title}`);
                }

                return {
                    product: (product as any)._id,
                    title: product.title,
                    price: item.price,
                    quantity: item.quantity,
                };
            }),
        );

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shipping = 0; // Free shipping
        const discountAmount = createOrderDto.discountAmount || 0;
        const total = subtotal + shipping - discountAmount;

        // Generate unique order number
        const orderNumber = this.generateOrderNumber();

        // Create order
        const order = new this.orderModel({
            user: userId,
            orderNumber,
            items: orderItems,
            shippingAddress: createOrderDto.shippingAddress,
            additionalInfo: createOrderDto.additionalInfo,
            paymentMethod: createOrderDto.paymentMethod,
            subtotal,
            shipping,
            discountAmount,
            couponCode: createOrderDto.couponCode || null,
            total,
            status: 'pending',
        });

        await order.save();

        // Update product stock
        await Promise.all(
            orderItems.map((item) =>
                this.productsService.updateStock(item.product.toString(), item.quantity),
            ),
        );

        // Clear cart
        await this.cartService.clearCart(userId);

        return order;
    }

    async findAll(): Promise<Order[]> {
        return this.orderModel.find().populate('user', 'name email').exec();
    }

    async findByUser(userId: string): Promise<Order[]> {
        return this.orderModel.find({ user: userId }).populate('items.product').exec();
    }

    async findByVendor(vendorId: string): Promise<Order[]> {
        // First, get all products by this vendor
        const vendorProducts = await this.productsService.findByVendor(vendorId);
        const productIds = vendorProducts.map(product => (product as any)._id);

        // Find orders that contain any of these products
        return this.orderModel
            .find({
                'items.product': { $in: productIds }
            })
            .populate('user', 'name email')
            .populate('items.product')
            .exec();
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.orderModel
            .findById(id)
            .populate('user', 'name email')
            .populate('items.product')
            .exec();

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return order;
    }

    async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
        const order = await this.orderModel
            .findByIdAndUpdate(
                id,
                { status: updateOrderStatusDto.status },
                { new: true },
            )
            .exec();

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return order;
    }

    async trackOrder(orderId: string, email: string): Promise<Order> {
        // Find order by ID (or Order Number if preferred, but ID is easier for now)
        // Let's assume input is Order Number or ID. Let's try both.
        let order = await this.orderModel.findOne({ orderNumber: orderId }).populate('items.product').exec();

        if (!order) {
            // Try by ID if valid ObjectId
            if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
                order = await this.orderModel.findById(orderId).populate('items.product').exec();
            }
        }

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Verify email matches shipping address email or user email
        // We need to populate user to check user email if needed, but shippingAddress email is safer for guest checkout scenarios (if we had them)
        // For now, let's check shippingAddress.email
        if (order.shippingAddress.email.toLowerCase() !== email.toLowerCase()) {
            throw new NotFoundException('Order not found'); // Don't reveal mismatch
        }

        return order;
    }

    private generateOrderNumber(): string {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${timestamp}-${random}`;
    }

    async getAnalytics() {
        const totalOrders = await this.orderModel.countDocuments().exec();

        const revenueResult = await this.orderModel.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]).exec();
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Get monthly sales for chart
        const monthlySales = await this.orderModel.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    sales: { $sum: "$total" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 6 } // Last 6 months
        ]).exec();

        return {
            totalOrders,
            totalRevenue,
            averageOrderValue,
            monthlySales: monthlySales.map(item => ({
                name: item._id, // e.g., "2023-10"
                sales: item.sales,
                orders: item.orders
            }))
        };
    }
}
