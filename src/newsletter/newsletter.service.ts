import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscriber, SubscriberDocument } from './schemas/subscriber.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { EmailService } from '../email/email.service';

@Injectable()
export class NewsletterService {
    constructor(
        @InjectModel(Subscriber.name) private subscriberModel: Model<SubscriberDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        private emailService: EmailService,
    ) { }

    async subscribe(email: string) {
        try {
            const subscriber = new this.subscriberModel({ email });
            const saved = await subscriber.save();

            // Send welcome email
            await this.emailService.sendNewsletterEmail(
                email,
                'Welcome to StyleHub Newsletter!',
                `
                <p>Thank you for subscribing to our newsletter!</p>
                <p>You'll now receive updates about:</p>
                <ul>
                    <li>New clothing arrivals</li>
                    <li>Exclusive discounts and offers</li>
                    <li>Fashion trends and tips</li>
                    <li>Vendor spotlights</li>
                </ul>
                <p>Stay tuned for amazing deals!</p>
                `
            );

            return saved;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('Email already subscribed');
            }
            throw error;
        }
    }

    async unsubscribe(email: string) {
        const result = await this.subscriberModel.findOneAndDelete({ email }).exec();
        if (!result) {
            throw new ConflictException('Email not found in subscribers');
        }
        return { message: 'Successfully unsubscribed' };
    }

    async findAll() {
        return this.subscriberModel.find().sort({ subscribedAt: -1 }).exec();
    }

    async getAdminNewsletterData() {
        // Get all users by role
        const allUsers = await this.userModel.find().select('name email role isEmailVerified createdAt').exec();
        const customers = allUsers.filter(user => user.role === 'user');
        const admins = allUsers.filter(user => user.role === 'admin');
        const vendorUsers = allUsers.filter(user => user.role === 'vendor');

        // Get all vendors with categories
        const vendors = await this.vendorModel.find()
            .populate('user', 'name email')
            .select('shopName businessName specialties status isActive user')
            .exec();

        // Group vendors by categories
        const vendorsByCategory = {};
        vendors.forEach(vendor => {
            vendor.specialties.forEach(specialty => {
                if (!vendorsByCategory[specialty]) {
                    vendorsByCategory[specialty] = [];
                }
                vendorsByCategory[specialty].push({
                    id: vendor._id,
                    shopName: vendor.shopName,
                    businessName: vendor.businessName,
                    email: (vendor.user as any)?.email,
                    status: vendor.status,
                    isActive: vendor.isActive
                });
            });
        });

        // Get products by category
        const products = await this.productModel.find()
            .select('title topCategory subCategory vendor isApproved isActive')
            .populate('vendor', 'name email')
            .exec();

        const productsByCategory = {};
        products.forEach(product => {
            const category = `${product.topCategory} - ${product.subCategory}`;
            if (!productsByCategory[category]) {
                productsByCategory[category] = [];
            }
            productsByCategory[category].push({
                id: product._id,
                title: product.title,
                vendor: product.vendor,
                isApproved: product.isApproved,
                isActive: product.isActive
            });
        });

        // Get newsletter subscribers
        const subscribers = await this.findAll();

        // Get statistics
        const stats = {
            totalUsers: allUsers.length,
            totalCustomers: customers.length,
            totalVendors: vendors.length,
            totalAdmins: admins.length,
            totalSubscribers: subscribers.length,
            totalProducts: products.length,
            activeVendors: vendors.filter(v => v.isActive).length,
            approvedVendors: vendors.filter(v => v.status === 'approved').length,
            pendingVendors: vendors.filter(v => v.status === 'pending').length,
            suspendedVendors: vendors.filter(v => v.status === 'suspended').length,
            approvedProducts: products.filter(p => p.isApproved).length,
            activeProducts: products.filter(p => p.isActive).length,
            verifiedUsers: allUsers.filter(u => u.isEmailVerified).length
        };

        return {
            stats,
            users: {
                all: allUsers,
                customers,
                vendors: vendorUsers,
                admins
            },
            vendors: {
                all: vendors,
                byCategory: vendorsByCategory,
                byStatus: {
                    approved: vendors.filter(v => v.status === 'approved'),
                    pending: vendors.filter(v => v.status === 'pending'),
                    suspended: vendors.filter(v => v.status === 'suspended'),
                    rejected: vendors.filter(v => v.status === 'rejected')
                }
            },
            products: {
                all: products,
                byCategory: productsByCategory,
                approved: products.filter(p => p.isApproved),
                pending: products.filter(p => !p.isApproved)
            },
            subscribers,
            categories: {
                vendor: Object.keys(vendorsByCategory),
                product: Object.keys(productsByCategory)
            }
        };
    }

    async sendToAll(subject: string, message: string) {
        const subscribers = await this.findAll();
        const emails = subscribers.map(sub => sub.email);

        // Send emails to all subscribers
        const results = await Promise.allSettled(
            emails.map(email => this.emailService.sendNewsletterEmail(email, subject, message))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
            message: `Newsletter sent to ${successful} subscribers`,
            total: emails.length,
            successful,
            failed,
            recipients: emails
        };
    }

    async sendTargeted(subject: string, message: string, targets: string[], categories?: string[]) {
        let emails: string[] = [];

        for (const target of targets) {
            switch (target) {
                case 'all-users':
                    const allUsers = await this.userModel.find().select('email').exec();
                    emails.push(...allUsers.map(u => u.email));
                    break;

                case 'customers':
                    const customers = await this.userModel.find({ role: 'user' }).select('email').exec();
                    emails.push(...customers.map(u => u.email));
                    break;

                case 'vendors':
                    let vendorQuery = {};
                    if (categories && categories.length > 0) {
                        vendorQuery = { specialties: { $in: categories } };
                    }
                    const vendors = await this.vendorModel.find(vendorQuery)
                        .populate('user', 'email')
                        .exec();
                    emails.push(...vendors.map(v => (v.user as any)?.email).filter(Boolean));
                    break;

                case 'subscribers':
                    const subscribers = await this.findAll();
                    emails.push(...subscribers.map(s => s.email));
                    break;

                case 'admins':
                    const admins = await this.userModel.find({ role: 'admin' }).select('email').exec();
                    emails.push(...admins.map(u => u.email));
                    break;
            }
        }

        // Remove duplicates
        emails = [...new Set(emails)];

        // Send emails
        const results = await Promise.allSettled(
            emails.map(email => this.emailService.sendNewsletterEmail(email, subject, message))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
            message: `Targeted newsletter sent to ${successful} recipients`,
            total: emails.length,
            successful,
            failed,
            targets,
            categories,
            recipients: emails
        };
    }
}
