import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ProductsModule } from '../products/products.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        HttpModule,
        ProductsModule,
        ConfigModule
    ],
    controllers: [AiController],
    providers: [AiService],
})
export class AiModule { }
