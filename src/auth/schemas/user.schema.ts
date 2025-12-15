import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ default: 'user', enum: ['user', 'admin', 'vendor'] })
    role: string;

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

    @Prop({
        type: {
            businessName: { type: String },
            address: { type: String },
            phone: { type: String },
            taxId: { type: String },
            description: { type: String },
        },
        default: null
    })
    vendorDetails: {
        businessName: string;
        address: string;
        phone: string;
        taxId: string;
        description: string;
    } | null;

    @Prop({ default: true })
    isApproved: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
