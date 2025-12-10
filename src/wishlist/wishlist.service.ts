import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { ProductsService } from '../products/products.service';

@Injectable()
export class WishlistService {
    constructor(
        @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
        private productsService: ProductsService,
    ) { }

    async getWishlist(userId: string): Promise<Wishlist> {
        let wishlist = await this.wishlistModel
            .findOne({ user: userId })
            .populate('products')
            .exec();

        if (!wishlist) {
            wishlist = await this.wishlistModel.create({ user: userId, products: [] });
        }

        return wishlist;
    }

    async toggleWishlist(userId: string, productId: string): Promise<Wishlist> {
        // Verify product exists
        await this.productsService.findOne(productId);

        let wishlist = await this.wishlistModel.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new this.wishlistModel({
                user: userId,
                products: [productId],
            });
        } else {
            const productIndex = wishlist.products.findIndex(
                (id) => id.toString() === productId,
            );

            if (productIndex > -1) {
                wishlist.products.splice(productIndex, 1);
            } else {
                wishlist.products.push(productId as any);
            }
        }

        await wishlist.save();
        return this.wishlistModel.findById(wishlist._id).populate('products').exec() as Promise<Wishlist>;
    }

    async removeFromWishlist(userId: string, productId: string): Promise<Wishlist> {
        const wishlist = await this.wishlistModel.findOne({ user: userId });
        if (!wishlist) {
            throw new NotFoundException('Wishlist not found');
        }

        wishlist.products = wishlist.products.filter(
            (id) => id.toString() !== productId,
        );

        await wishlist.save();
        return this.wishlistModel.findById(wishlist._id).populate('products').exec() as Promise<Wishlist>;
    }

    async isInWishlist(userId: string, productId: string): Promise<boolean> {
        const wishlist = await this.wishlistModel.findOne({ user: userId });
        if (!wishlist) {
            return false;
        }

        return wishlist.products.some((id) => id.toString() === productId);
    }
}
