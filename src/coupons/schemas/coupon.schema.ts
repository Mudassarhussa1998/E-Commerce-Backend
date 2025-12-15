import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CouponDocument = Coupon & Document;

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true, enum: CouponType })
  type: CouponType;

  @Prop({ required: true, min: 0 })
  value: number; // Percentage (0-100) or fixed amount

  @Prop({ min: 0 })
  minimumOrderAmount: number;

  @Prop({ min: 0 })
  maximumDiscountAmount: number; // For percentage coupons

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 0, min: 0 })
  usageLimit: number; // 0 = unlimited

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ default: 1, min: 1 })
  usageLimitPerUser: number;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  usedByUsers: { user: Types.ObjectId; count: number; usedAt: Date }[];

  @Prop([String])
  applicableCategories: string[]; // Empty array = all categories

  @Prop([{ type: Types.ObjectId, ref: 'Product' }])
  applicableProducts: Types.ObjectId[]; // Empty array = all products

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFirstTimeUser: boolean; // Only for first-time customers

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// Indexes
CouponSchema.index({ code: 1 });
CouponSchema.index({ startDate: 1, endDate: 1 });
CouponSchema.index({ isActive: 1 });