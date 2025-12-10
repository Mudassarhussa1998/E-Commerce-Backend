import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        const product = new this.productModel(createProductDto);
        return product.save();
    }

    async findAll(filterDto: FilterProductDto): Promise<Product[]> {
        const { category, isNew, isFeatured, search, minPrice, maxPrice } = filterDto;
        const query: any = {};

        if (category) {
            query.category = category;
        }

        if (isNew !== undefined) {
            query.isNew = isNew;
        }

        if (isFeatured !== undefined) {
            query.isFeatured = isFeatured;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { subtitle: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) {
                query.price.$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                query.price.$lte = maxPrice;
            }
        }

        return this.productModel.find(query).exec();
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async findByCategory(category: string): Promise<Product[]> {
        return this.productModel.find({ category }).exec();
    }

    async findFeatured(): Promise<Product[]> {
        return this.productModel.find({ isFeatured: true }).exec();
    }

    async findNew(): Promise<Product[]> {
        return this.productModel.find({ isNew: true }).exec();
    }

    async findByVendor(vendorId: string): Promise<Product[]> {
        return this.productModel.find({ vendor: vendorId }).exec();
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        const product = await this.productModel
            .findByIdAndUpdate(id, updateProductDto, { new: true })
            .exec();

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async remove(id: string): Promise<void> {
        const result = await this.productModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
    }

    async updateStock(id: string, quantity: number): Promise<Product> {
        const product = await this.findOne(id);

        if (product.stock < quantity) {
            throw new NotFoundException(`Insufficient stock for product ${id}`);
        }

        product.stock -= quantity;
        return (product as any).save();
    }
}
