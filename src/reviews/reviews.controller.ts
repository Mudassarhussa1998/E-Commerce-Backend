import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.id, createReviewDto);
  }

  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.reviewsService.getProductReviews(productId, page, limit);
  }

  @Get('product/:productId/stats')
  async getProductRatingStats(@Param('productId') productId: string) {
    return this.reviewsService.getProductRatingStats(productId);
  }

  @Post(':reviewId/helpful')
  @UseGuards(JwtAuthGuard)
  async markHelpful(@Param('reviewId') reviewId: string, @Request() req) {
    return this.reviewsService.markHelpful(reviewId, req.user.id);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('reviewId') reviewId: string, @Request() req) {
    const isAdmin = req.user.role === 'admin';
    return this.reviewsService.deleteReview(reviewId, req.user.id, isAdmin);
  }

  @Get('user/my-reviews')
  @UseGuards(JwtAuthGuard)
  async getUserReviews(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.reviewsService.getUserReviews(req.user.id, page, limit);
  }
}