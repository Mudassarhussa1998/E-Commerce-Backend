import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    VENDOR = 'vendor',
}

export enum UserStatus {
    ACTIVE = 'active',
    BLOCKED = 'blocked',
    SUSPENDED = 'suspended',
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: UserRole.USER, enum: Object.values(UserRole) })
    role: UserRole;

    @Prop({ default: UserStatus.ACTIVE, enum: Object.values(UserStatus) })
    status: UserStatus;

    @Prop({ type: String, default: null })
    refreshToken: string | null;

    @Prop({ type: String, default: null })
    resetPasswordToken: string | null;

    @Prop({ type: Date, default: null })
    resetPasswordExpires: Date | null;

    @Prop({ type: String, default: null })
    otp: string | null;

    @Prop({ type: Date, default: null })
    otpExpires: Date | null;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({ type: String, default: null })
    emailVerificationOtp: string | null;

    @Prop({ type: Date, default: null })
    emailVerificationOtpExpires: Date | null;

    @Prop({ default: true })
    isApproved: boolean;

    @Prop([{
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        streetAddress: { type: String, required: true },
        city: { type: String, required: true },
        province: { type: String, required: true },
        zipCode: { type: String, required: true },
        phone: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }])
    addresses: {
        firstName: string;
        lastName: string;
        streetAddress: string;
        city: string;
        province: string;
        zipCode: string;
        phone: string;
        isDefault: boolean;
    }[];

    // Additional user fields
    @Prop()
    phoneNumber: string;

    @Prop()
    dateOfBirth: Date;

    @Prop({ enum: ['Male', 'Female', 'Other'] })
    gender: string;

    @Prop({ default: '/images/default-avatar.png' })
    avatar: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    blockedBy: Types.ObjectId; // Admin who blocked the user

    @Prop()
    blockReason: string;

    @Prop()
    blockedAt: Date;

    @Prop({ default: 0 })
    totalOrders: number;

    @Prop({ default: 0 })
    totalSpent: number;

    @Prop()
    lastLoginAt: Date;

    @Prop({ type: Object, default: null })
    vendorDetails: any;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ name: 'text', email: 'text' });
