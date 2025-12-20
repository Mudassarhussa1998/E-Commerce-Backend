import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VendorDocument = Vendor & Document;

export enum VendorStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    SUSPENDED = 'suspended',
}

@Schema({ timestamps: true })
export class Vendor {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ required: true })
    shopName: string;

    @Prop({ required: true })
    businessName: string;

    @Prop({ required: true })
    businessType: string; // Individual, Company, Partnership

    @Prop()
    businessCategory: string;

    @Prop()
    businessDescription: string;

    @Prop()
    establishedYear: number;

    @Prop({ required: true })
    contactPerson: string;

    @Prop({ required: true })
    phoneNumber: string;

    @Prop({ required: true })
    alternatePhone: string;

    @Prop({ required: true })
    email: string;

    @Prop()
    cnicNumber: string;

    @Prop()
    dateOfBirth: string;

    @Prop({ 
        type: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true }
        },
        required: true 
    })
    businessAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };

    @Prop({ 
        type: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true }
        },
        required: true 
    })
    pickupAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };

    @Prop({ 
        type: {
            accountHolderName: { type: String, required: true },
            accountNumber: { type: String, required: true },
            bankName: { type: String, required: true },
            ifscCode: { type: String, required: true },
            branchName: { type: String, required: true }
        },
        required: true 
    })
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        bankName: string;
        ifscCode: string;
        branchName: string;
    };

    @Prop({ 
        type: {
            gstNumber: { type: String, required: true },
            panNumber: { type: String, required: true },
            ntnNumber: { type: String, required: false }
        },
        required: true 
    })
    taxDetails: {
        gstNumber: string;
        panNumber: string;
        ntnNumber: string;
    };

    @Prop({ 
        type: {
            businessLicense: { type: String, required: true },
            taxCertificate: { type: String, required: true },
            identityProof: { type: String, required: true },
            addressProof: { type: String, required: true },
            personalPhoto: { type: String, required: false },
            cnicFrontPhoto: { type: String, required: false },
            cnicBackPhoto: { type: String, required: false }
        },
        required: true 
    })
    documents: {
        businessLicense: string; // File path
        taxCertificate: string; // File path
        identityProof: string; // File path
        addressProof: string; // File path
        personalPhoto: string; // File path
        cnicFrontPhoto: string; // File path
        cnicBackPhoto: string; // File path
    };

    @Prop({ required: true, enum: Object.values(VendorStatus), default: VendorStatus.PENDING })
    status: VendorStatus;

    @Prop()
    rejectionReason: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    approvedBy: Types.ObjectId;

    @Prop()
    approvedAt: Date;

    @Prop({ default: '' })
    shopDescription: string;

    @Prop({ default: '/images/default-shop.png' })
    shopLogo: string;

    @Prop({ default: '/images/default-banner.png' })
    shopBanner: string;

    @Prop({ default: '' })
    shopBackgroundImage: string;

    @Prop({ type: [String], default: [] })
    specialties: string[]; // Men's wear, Women's wear, etc.

    @Prop({ default: 0 })
    totalProducts: number;

    @Prop({ default: 0 })
    totalOrders: number;

    @Prop({ default: 0, min: 0, max: 5 })
    averageRating: number;

    @Prop({ default: 0 })
    totalReviews: number;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ type: [String], default: [] })
    socialLinks: string[];

    @Prop({ default: 0 })
    commissionRate: number; // Platform commission percentage
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

// Indexes
VendorSchema.index({ user: 1 });
VendorSchema.index({ status: 1 });
VendorSchema.index({ shopName: 'text', businessName: 'text' });
VendorSchema.index({ isActive: 1, isVerified: 1 });