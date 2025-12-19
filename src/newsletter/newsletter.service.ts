import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscriber, SubscriberDocument } from './schemas/subscriber.schema';
import { EmailService } from '../email/email.service';

@Injectable()
export class NewsletterService {
    constructor(
        @InjectModel(Subscriber.name) private subscriberModel: Model<SubscriberDocument>,
        private emailService: EmailService,
    ) { }

    async subscribe(email: string) {
        try {
            const subscriber = new this.subscriberModel({ email });
            const saved = await subscriber.save();

            // Send welcome email
            await this.emailService.sendNewsletterEmail(
                email,
                'Welcome to Funiro Newsletter!',
                `
                <p>Thank you for subscribing to our newsletter!</p>
                <p>You'll now receive updates about:</p>
                <ul>
                    <li>New furniture arrivals</li>
                    <li>Exclusive discounts and offers</li>
                    <li>Interior design tips</li>
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
}
