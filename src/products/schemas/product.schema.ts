import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

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

    @Prop({ required: true, enum: ['Chairs', 'Sofas', 'Tables', 'Beds', 'Storage'] })
    category: string;

    @Prop({ required: true })
    stock: number;

    @Prop({ default: '/images/shelf.png' })
    image: string;

    @Prop({ default: false })
    isNew: boolean;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ type: 'ObjectId', ref: 'User' })
    vendor: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
