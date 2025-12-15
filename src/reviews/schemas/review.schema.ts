import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  comment: string;

  @Prop({ default: false })
  verified: boolean; // If user actually purchased the product

  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  helpfulUsers: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Index for efficient queries
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, rating: -1 });
ReviewSchema.index({ createdAt: -1 });