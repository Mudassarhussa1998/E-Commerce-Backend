import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItem {
    @Prop({ type: Types.ObjectId, ref: 'Product' })
    product: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop()
    companyName: string;

    @Prop({ required: true })
    country: string;

    @Prop({ required: true })
    streetAddress: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    province: string;

    @Prop({ required: true })
    zipCode: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    email: string;
}

export const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ timestamps: true })
export class Order {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true, unique: true })
    orderNumber: string;

    @Prop({ type: [OrderItemSchema], required: true })
    items: OrderItem[];

    @Prop({ type: ShippingAddressSchema, required: true })
    shippingAddress: ShippingAddress;

    @Prop()
    additionalInfo: string;

    @Prop({ required: true, enum: ['bank', 'cod'] })
    paymentMethod: string;

    @Prop({ required: true })
    subtotal: number;

    @Prop({ default: 0 })
    shipping: number;

    @Prop({ required: true })
    total: number;

    @Prop({
        default: 'pending',
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    })
    status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
