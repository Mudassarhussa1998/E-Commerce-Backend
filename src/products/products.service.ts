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

    async findAll(filterDto: FilterProductDto): Promise<{
        products: Product[];
        total: number;
        page: number;
        pages: number;
        hasMore: boolean;
    }> {
        const { category, isNew, isFeatured, search, minPrice, maxPrice, vendor, isApproved } = filterDto;
        const query: any = {};

        // Approval filter - only show approved products by default for public access
        // But allow explicit filtering by isApproved parameter
        if (isApproved !== undefined) {
            query.isApproved = isApproved;
        }
        // Note: Removed default filtering to approved only - let frontend/admin decide

        // Category filter
        if (category) {
            query.category = category;
        }

        // Boolean filters
        if (isNew !== undefined) {
            query.isNew = isNew;
        }

        if (isFeatured !== undefined) {
            query.isFeatured = isFeatured;
        }

        // Vendor filter
        if (vendor) {
            query.vendor = vendor;
        }

        // Enhanced search with text scoring
        if (search) {
            const searchTerms = search.split(' ').filter(term => term.length > 0);
            const searchRegex = searchTerms.map(term => new RegExp(term, 'i'));
            
            query.$or = [
                // Exact phrase match (highest priority)
                { title: { $regex: search, $options: 'i' } },
                { subtitle: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                // Individual word matches
                ...searchRegex.flatMap(regex => [
                    { title: regex },
                    { subtitle: regex },
                    { description: regex },
                    { category: regex }
                ])
            ];
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) {
                query.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined) {
                query.price.$lte = Number(maxPrice);
            }
        }

        // Stock filter
        if (filterDto.inStock) {
            query.stock = { $gt: 0 };
        }

        // Rating filter
        if (filterDto.minRating && filterDto.minRating > 0) {
            query.averageRating = { $gte: Number(filterDto.minRating) };
        }

        // Pagination
        const page = (filterDto as any).page && (filterDto as any).page > 0 ? Number((filterDto as any).page) : 1;
        const limit = (filterDto as any).limit && (filterDto as any).limit > 0 ? Number((filterDto as any).limit) : 20;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await this.productModel.countDocuments(query);

        // Build query with sorting
        let sortQuery: any = {};
        const sortBy = (filterDto as any).sortBy || 'createdAt';
        const sortOrder = (filterDto as any).sortOrder === 'asc' ? 1 : -1;

        switch (sortBy) {
            case 'price':
                sortQuery.price = sortOrder;
                break;
            case 'rating':
                sortQuery.averageRating = sortOrder;
                sortQuery.totalReviews = -1; // Secondary sort by review count
                break;
            case 'popularity':
                sortQuery.totalReviews = sortOrder;
                sortQuery.averageRating = -1; // Secondary sort by rating
                break;
            case 'name':
                sortQuery.title = sortOrder;
                break;
            case 'newest':
                sortQuery.createdAt = -1;
                break;
            case 'featured':
                sortQuery.isFeatured = -1;
                sortQuery.createdAt = -1;
                break;
            default:
                sortQuery.createdAt = sortOrder;
        }

        // Execute query
        const products = await this.productModel
            .find(query)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .exec();

        const pages = Math.ceil(total / limit);
        const hasMore = page < pages;

        return {
            products,
            total,
            page,
            pages,
            hasMore,
        };
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

    async update(id: string, updateProductDto: UpdateProductDto, userId: string, userRole: string, files?: Express.Multer.File[]): Promise<Product> {
        const product = await this.productModel.findById(id).exec();
        
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Check permissions: admin can update any product, vendor can only update their own
        if (userRole !== 'admin' && product.vendor.toString() !== userId) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Handle file uploads if provided
        const updateData = { ...updateProductDto };
        if (files && files.length > 0) {
            const imagePaths = files.map(file => `/uploads/${file.filename}`);
            updateData.images = imagePaths;
        }

        const updatedProduct = await this.productModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();

        if (!updatedProduct) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return updatedProduct;
    }

    async remove(id: string, userId: string, userRole: string): Promise<void> {
        const product = await this.productModel.findById(id).exec();
        
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Check permissions: admin can delete any product, vendor can only delete their own
        if (userRole !== 'admin' && product.vendor.toString() !== userId) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        await this.productModel.findByIdAndDelete(id).exec();
    }

    async updateStock(id: string, quantity: number): Promise<Product> {
        const product = await this.findOne(id);

        if (product.stock < quantity) {
            throw new NotFoundException(`Insufficient stock for product ${id}`);
        }

        product.stock -= quantity;
        return (product as any).save();
    }
    async getRecommendations(id: string): Promise<Product[]> {
        const product = await this.findOne(id);
        const { topCategory, price } = product;

        // Find products in the same category, with similar price (+/- 20%), excluding the current product
        const minPrice = price * 0.8;
        const maxPrice = price * 1.2;

        return this.productModel.find({
            _id: { $ne: id },
            topCategory: product.topCategory,
            price: { $gte: minPrice, $lte: maxPrice },
        }).limit(4).exec();
    }

    async getSearchSuggestions(query: string, limit: number = 5): Promise<Product[]> {
        if (!query || query.length < 2) {
            return [];
        }

        const searchRegex = new RegExp(query, 'i');
        
        return this.productModel
            .find({
                $or: [
                    { title: searchRegex },
                    { subtitle: searchRegex },
                    { category: searchRegex }
                ]
            })
            .select('title subtitle category price image averageRating')
            .sort({ averageRating: -1, totalReviews: -1 })
            .limit(limit)
            .exec();
    }

    async getPopularSearchTerms(): Promise<string[]> {
        // Get most common words from product titles and categories
        const products = await this.productModel
            .find({}, 'title category')
            .exec();

        const wordCount: { [key: string]: number } = {};
        
        products.forEach(product => {
            const words = [
                ...product.title.toLowerCase().split(' '),
                product.topCategory.toLowerCase()
            ];
            
            words.forEach(word => {
                if (word.length > 3) { // Only count words longer than 3 characters
                    wordCount[word] = (wordCount[word] || 0) + 1;
                }
            });
        });

        // Return top 10 most common terms
        return Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    async getFilterOptions(): Promise<{
        categories: string[];
        priceRanges: { min: number; max: number; count: number }[];
        maxPrice: number;
        minPrice: number;
    }> {
        // Get all unique categories
        const categories: string[] = await this.productModel.distinct('topCategory');

        // Get price statistics
        const priceStats = await this.productModel.aggregate([
            {
                $group: {
                    _id: null,
                    maxPrice: { $max: '$price' },
                    minPrice: { $min: '$price' },
                    avgPrice: { $avg: '$price' }
                }
            }
        ]);

        const { maxPrice, minPrice } = priceStats[0] || { maxPrice: 0, minPrice: 0 };

        // Create price ranges
        const rangeSize = (maxPrice - minPrice) / 5;
        const priceRanges: { min: number; max: number; count: number }[] = [];

        for (let i = 0; i < 5; i++) {
            const rangeMin = minPrice + (i * rangeSize);
            const rangeMax = i === 4 ? maxPrice : minPrice + ((i + 1) * rangeSize);
            
            const count = await this.productModel.countDocuments({
                price: { $gte: rangeMin, $lte: rangeMax }
            });

            if (count > 0) {
                priceRanges.push({
                    min: Math.round(rangeMin),
                    max: Math.round(rangeMax),
                    count
                });
            }
        }

        return {
            categories,
            priceRanges,
            maxPrice: Math.round(maxPrice),
            minPrice: Math.round(minPrice)
        };
    }

    async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
        const product = await this.findOne(productId);
        
        // Find products in same category with similar price range
        const priceRange = product.price * 0.3; // 30% price variance
        
        return this.productModel
            .find({
                _id: { $ne: productId },
                topCategory: product.topCategory,
                price: {
                    $gte: product.price - priceRange,
                    $lte: product.price + priceRange
                }
            })
            .sort({ averageRating: -1, totalReviews: -1 })
            .limit(limit)
            .exec();
    }

    async approveProduct(id: string, adminId: string): Promise<Product> {
        const product = await this.productModel.findByIdAndUpdate(
            id,
            { 
                isApproved: true,
                approvedBy: adminId,
                approvedAt: new Date()
            },
            { new: true }
        ).exec();

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async rejectProduct(id: string, adminId: string): Promise<Product> {
        const product = await this.productModel.findByIdAndUpdate(
            id,
            { 
                isApproved: false,
                rejectedBy: adminId,
                rejectedAt: new Date()
            },
            { new: true }
        ).exec();

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }
}
