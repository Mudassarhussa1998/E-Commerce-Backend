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
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
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
        const total = subtotal + shipping;

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

    private generateOrderNumber(): string {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${timestamp}-${random}`;
    }
}
