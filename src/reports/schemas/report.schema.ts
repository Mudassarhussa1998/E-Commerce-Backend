import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export enum ReportType {
    VENDOR_REPORT = 'vendor_report',
    CUSTOMER_REPORT = 'customer_report',
    PRODUCT_REPORT = 'product_report',
    ORDER_ISSUE = 'order_issue',
    PAYMENT_ISSUE = 'payment_issue',
    QUALITY_ISSUE = 'quality_issue',
    DELIVERY_ISSUE = 'delivery_issue',
    FRAUD_REPORT = 'fraud_report',
    INAPPROPRIATE_CONTENT = 'inappropriate_content',
    OTHER = 'other',
}

export enum ReportStatus {
    PENDING = 'pending',
    UNDER_REVIEW = 'under_review',
    RESOLVED = 'resolved',
    REJECTED = 'rejected',
    ESCALATED = 'escalated',
}

export enum ReportPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class Report {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    reportedBy: Types.ObjectId; // User who made the report

    @Prop({ required: true, enum: Object.values(ReportType) })
    type: ReportType;

    @Prop({ required: true })
    subject: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    reportedUser: Types.ObjectId; // User being reported (if applicable)

    @Prop({ type: Types.ObjectId, ref: 'Vendor' })
    reportedVendor: Types.ObjectId; // Vendor being reported (if applicable)

    @Prop({ type: Types.ObjectId, ref: 'Product' })
    reportedProduct: Types.ObjectId; // Product being reported (if applicable)

    @Prop({ type: Types.ObjectId, ref: 'Order' })
    relatedOrder: Types.ObjectId; // Related order (if applicable)

    @Prop({ required: true, enum: Object.values(ReportStatus), default: ReportStatus.PENDING })
    status: ReportStatus;

    @Prop({ required: true, enum: Object.values(ReportPriority), default: ReportPriority.MEDIUM })
    priority: ReportPriority;

    @Prop({ type: [String], default: [] })
    attachments: string[]; // File paths for evidence

    @Prop({ type: Types.ObjectId, ref: 'User' })
    assignedTo: Types.ObjectId; // Admin assigned to handle the report

    @Prop()
    adminNotes: string;

    @Prop()
    resolution: string;

    @Prop()
    resolvedAt: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    resolvedBy: Types.ObjectId;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ default: false })
    isPublic: boolean; // Whether the report can be seen by other users

    @Prop({ type: [{
        message: String,
        author: { type: Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        isInternal: { type: Boolean, default: false } // Internal admin notes
    }], default: [] })
    comments: {
        message: string;
        author: Types.ObjectId;
        createdAt: Date;
        isInternal: boolean;
    }[];

    @Prop({ default: 0 })
    upvotes: number; // Other users can upvote the report

    @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
    upvotedBy: Types.ObjectId[];
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Indexes
ReportSchema.index({ reportedBy: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ priority: 1 });
ReportSchema.index({ assignedTo: 1 });
ReportSchema.index({ reportedUser: 1 });
ReportSchema.index({ reportedVendor: 1 });
ReportSchema.index({ createdAt: -1 });