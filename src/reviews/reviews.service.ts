import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    const { productId, rating, title, comment } = createReviewDto;

    // Check if product exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewModel.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Create review
    const review = new this.reviewModel({
      user: userId,
      product: productId,
      rating,
      title,
      comment,
    });

    const savedReview = await review.save();
    
    // Update product rating
    await this.updateProductRating(productId);

    return savedReview.populate('user', 'name');
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const reviews = await this.reviewModel
      .find({ product: productId, isActive: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.reviewModel.countDocuments({ 
      product: productId, 
      isActive: true 
    });

    const ratingStats = await this.getProductRatingStats(productId);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: ratingStats,
    };
  }

  async getProductRatingStats(productId: string) {
    const stats = await this.reviewModel.aggregate([
      { $match: { product: new Types.ObjectId(productId), isActive: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (!stats.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const { averageRating, totalReviews, ratingDistribution } = stats[0];
    
    // Calculate distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      distribution,
    };
  }

  async updateProductRating(productId: string) {
    const stats = await this.getProductRatingStats(productId);
    
    await this.productModel.findByIdAndUpdate(productId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  }

  async markHelpful(reviewId: string, userId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const hasMarked = review.helpfulUsers.some(id => id.equals(userObjectId));

    if (hasMarked) {
      // Remove helpful mark
      review.helpfulUsers = review.helpfulUsers.filter(id => !id.equals(userObjectId));
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add helpful mark
      review.helpfulUsers.push(userObjectId);
      review.helpfulCount++;
    }

    return review.save();
  }

  async deleteReview(reviewId: string, userId: string, isAdmin = false) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only allow user to delete their own review or admin to delete any
    if (!isAdmin && review.user.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewModel.findByIdAndDelete(reviewId);
    
    // Update product rating
    await this.updateProductRating(review.product.toString());

    return { message: 'Review deleted successfully' };
  }

  async getUserReviews(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const reviews = await this.reviewModel
      .find({ user: userId })
      .populate('product', 'title image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.reviewModel.countDocuments({ user: userId });

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}