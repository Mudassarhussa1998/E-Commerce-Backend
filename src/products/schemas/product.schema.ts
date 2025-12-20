import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

export enum TopCategory {
    MEN = 'Men',
    WOMEN = 'Women',
    KIDS = 'Kids',
    FOOTWEAR = 'Footwear',
}

export enum SubCategory {
    // Men & Women
    UNSTITCHED = 'Unstitched',
    STITCHED = 'Stitched',
    JEANS = 'Jeans',
    SHIRTS = 'Shirts',
    DRESS_SHIRTS = 'Dress Shirts',
    WEST = 'West',
    T_SHIRTS = 'T-Shirts',
    TROUSERS = 'Trousers',
    JACKETS = 'Jackets',
    SWEATERS = 'Sweaters',
    HOODIES = 'Hoodies',
    BLAZERS = 'Blazers',
    // Kids specific
    KIDS_CASUAL = 'Kids Casual',
    KIDS_FORMAL = 'Kids Formal',
    KIDS_SCHOOL = 'Kids School',
    // Footwear
    SNEAKERS = 'Sneakers',
    FORMAL_SHOES = 'Formal Shoes',
    SANDALS = 'Sandals',
    BOOTS = 'Boots',
    SLIPPERS = 'Slippers',
    SPORTS_SHOES = 'Sports Shoes',
}

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    subtitle: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop()
    originalPrice: number;

    @Prop()
    discount: number;

    @Prop({ required: true, enum: Object.values(TopCategory) })
    topCategory: TopCategory;

    @Prop({ required: true, enum: Object.values(SubCategory) })
    subCategory: SubCategory;

    // Clothing specific fields
    @Prop({ type: [String], default: [] })
    colors: string[];

    @Prop({ type: [String], default: [] })
    sizes: string[]; // XS, S, M, L, XL, XXL, etc.

    @Prop({ type: Map, of: Number, default: {} })
    stockBySize: Map<string, number>; // { "M": 10, "L": 5 }

    @Prop({ required: true, default: 0 })
    stock: number; // Total stock

    @Prop({ default: '/images/default-product.png' })
    image: string;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ default: false })
    isNew: boolean;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    vendor: Types.ObjectId;

    @Prop({ default: 0, min: 0, max: 5 })
    averageRating: number;

    @Prop({ default: 0 })
    totalReviews: number;

    @Prop({ default: false })
    isApproved: boolean; // Admin approval required

    @Prop({ type: Types.ObjectId, ref: 'User' })
    approvedBy: Types.ObjectId;

    @Prop()
    approvedAt: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    rejectedBy: Types.ObjectId;

    @Prop()
    rejectedAt: Date;

    @Prop({ default: true })
    isActive: boolean; // Vendor can activate/deactivate

    // Additional clothing details
    @Prop()
    material: string; // Cotton, Polyester, etc.

    @Prop()
    brand: string;

    @Prop({ enum: ['Male', 'Female', 'Unisex'] })
    gender: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop()
    sku: string; // Stock Keeping Unit

    @Prop()
    weight: number; // For shipping calculations

    @Prop({ default: 'In Stock' })
    stockStatus: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for better performance
ProductSchema.index({ topCategory: 1, subCategory: 1 });
ProductSchema.index({ vendor: 1 });
ProductSchema.index({ isApproved: 1, isActive: 1 });
ProductSchema.index({ title: 'text', description: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ averageRating: -1 });