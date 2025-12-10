import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscriber, SubscriberDocument } from './schemas/subscriber.schema';

@Injectable()
export class NewsletterService {
    constructor(
        @InjectModel(Subscriber.name) private subscriberModel: Model<SubscriberDocument>,
    ) { }

    async subscribe(email: string) {
        try {
            const subscriber = new this.subscriberModel({ email });
            return await subscriber.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('Email already subscribed');
            }
            throw error;
        }
    }

    async findAll() {
        return this.subscriberModel.find().sort({ subscribedAt: -1 }).exec();
    }

    async sendToAll(subject: string, message: string) {
        const subscribers = await this.findAll();
        const emails = subscribers.map(sub => sub.email);

        // Simulate sending email
        console.log('---------------------------------------------------');
        console.log(`Sending Newsletter: "${subject}"`);
        console.log(`To: ${emails.length} subscribers`);
        console.log(`Message: ${message}`);
        console.log('Recipients:', emails.join(', '));
        console.log('---------------------------------------------------');

        return {
            message: `Newsletter sent to ${emails.length} subscribers`,
            recipients: emails
        };
    }
}
