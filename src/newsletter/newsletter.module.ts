import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { Subscriber, SubscriberSchema } from './schemas/subscriber.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Subscriber.name, schema: SubscriberSchema },
            { name: User.name, schema: UserSchema },
            { name: Vendor.name, schema: VendorSchema },
            { name: Product.name, schema: ProductSchema },
        ]),
        EmailModule,
    ],
    controllers: [NewsletterController],
    providers: [NewsletterService],
})
export class NewsletterModule { }
