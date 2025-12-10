import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
        private productsService: ProductsService,
    ) { }

    async getCart(userId: string): Promise<Cart> {
        let cart = await this.cartModel
            .findOne({ user: userId })
            .populate('items.product')
            .exec();

        if (!cart) {
            cart = await this.cartModel.create({ user: userId, items: [] });
        }

        return cart;
    }

    async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
        const { productId, quantity } = addToCartDto;

        // Verify product exists and has sufficient stock
        const product = await this.productsService.findOne(productId);
        if (product.stock < quantity) {
            throw new BadRequestException('Insufficient stock');
        }

        let cart = await this.cartModel.findOne({ user: userId });

        if (!cart) {
            cart = new this.cartModel({
                user: userId,
                items: [{ product: productId, quantity, price: product.price }],
            });
        } else {
            const existingItemIndex = cart.items.findIndex(
                (item) => item.product.toString() === productId,
            );

            if (existingItemIndex > -1) {
                const newQuantity = cart.items[existingItemIndex].quantity + quantity;
                if (product.stock < newQuantity) {
                    throw new BadRequestException('Insufficient stock');
                }
                cart.items[existingItemIndex].quantity = newQuantity;
            } else {
                cart.items.push({ product: productId as any, quantity, price: product.price });
            }
        }

        await cart.save();
        return this.cartModel.findById(cart._id).populate('items.product').exec() as Promise<Cart>;
    }

    async updateCartItem(
        userId: string,
        productId: string,
        updateCartItemDto: UpdateCartItemDto,
    ): Promise<Cart> {
        const { quantity } = updateCartItemDto;

        const cart = await this.cartModel.findOne({ user: userId });
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId,
        );

        if (itemIndex === -1) {
            throw new NotFoundException('Item not found in cart');
        }

        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            // Verify stock
            const product = await this.productsService.findOne(productId);
            if (product.stock < quantity) {
                throw new BadRequestException('Insufficient stock');
            }
            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();
        return this.cartModel.findById(cart._id).populate('items.product').exec() as Promise<Cart>;
    }

    async removeFromCart(userId: string, productId: string): Promise<Cart> {
        const cart = await this.cartModel.findOne({ user: userId });
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        cart.items = cart.items.filter(
            (item) => item.product.toString() !== productId,
        );

        await cart.save();
        return this.cartModel.findById(cart._id).populate('items.product').exec() as Promise<Cart>;
    }

    async clearCart(userId: string): Promise<void> {
        await this.cartModel.findOneAndUpdate(
            { user: userId },
            { items: [] },
            { new: true },
        );
    }

    async getCartTotal(userId: string): Promise<number> {
        const cart = await this.getCart(userId);
        return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    }
}
