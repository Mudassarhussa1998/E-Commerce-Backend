import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument, CouponType } from './schemas/coupon.schema';
import { CreateCouponDto, ValidateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  async createCoupon(createCouponDto: CreateCouponDto, adminId: string): Promise<Coupon> {
    // Check if coupon code already exists
    const existingCoupon = await this.couponModel.findOne({
      code: createCouponDto.code,
    });

    if (existingCoupon) {
      throw new ConflictException('Coupon code already exists');
    }

    // Validate dates
    if (createCouponDto.startDate >= createCouponDto.endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate percentage value
    if (createCouponDto.type === CouponType.PERCENTAGE && createCouponDto.value > 100) {
      throw new BadRequestException('Percentage value cannot exceed 100');
    }

    const coupon = new this.couponModel({
      ...createCouponDto,
      createdBy: adminId,
    });

    return coupon.save();
  }

  async validateCoupon(
    validateCouponDto: ValidateCouponDto,
    userId?: string,
  ): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discount?: number;
    message?: string;
  }> {
    const { code, orderAmount, cartItems = [] } = validateCouponDto;

    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    const now = new Date();

    // Check if coupon is within valid date range
    if (now < coupon.startDate || now > coupon.endDate) {
      return { valid: false, message: 'Coupon has expired or not yet active' };
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit exceeded' };
    }

    // Check minimum order amount
    if (coupon.minimumOrderAmount && orderAmount < coupon.minimumOrderAmount) {
      return {
        valid: false,
        message: `Minimum order amount of $${coupon.minimumOrderAmount} required`,
      };
    }

    // Check user-specific limits
    if (userId) {
      const userUsage = coupon.usedByUsers.find(
        (usage) => usage.user.toString() === userId,
      );

      if (userUsage && userUsage.count >= coupon.usageLimitPerUser) {
        return { valid: false, message: 'You have exceeded the usage limit for this coupon' };
      }

      // Check if it's for first-time users only
      if (coupon.isFirstTimeUser) {
        // You would need to check if user has previous orders
        // This is a simplified check - implement based on your order history
      }
    }

    // Check if coupon applies to cart items
    if (coupon.applicableCategories.length > 0 || coupon.applicableProducts.length > 0) {
      const applicableItems = cartItems.filter((item) => {
        // This would need product data to check categories
        // For now, assume all items are applicable
        return true;
      });

      if (applicableItems.length === 0) {
        return { valid: false, message: 'Coupon not applicable to cart items' };
      }
    }

    // Calculate discount
    let discount = 0;
    switch (coupon.type) {
      case CouponType.PERCENTAGE:
        discount = (orderAmount * coupon.value) / 100;
        if (coupon.maximumDiscountAmount && discount > coupon.maximumDiscountAmount) {
          discount = coupon.maximumDiscountAmount;
        }
        break;
      case CouponType.FIXED_AMOUNT:
        discount = Math.min(coupon.value, orderAmount);
        break;
      case CouponType.FREE_SHIPPING:
        // This would be handled in shipping calculation
        discount = 0; // Or shipping cost
        break;
    }

    return {
      valid: true,
      coupon,
      discount: Math.round(discount * 100) / 100,
    };
  }

  async applyCoupon(couponId: string, userId: string): Promise<void> {
    const coupon = await this.couponModel.findById(couponId);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Update usage count
    coupon.usedCount++;

    // Update user usage
    const userUsageIndex = coupon.usedByUsers.findIndex(
      (usage) => usage.user.toString() === userId,
    );

    if (userUsageIndex >= 0) {
      coupon.usedByUsers[userUsageIndex].count++;
      coupon.usedByUsers[userUsageIndex].usedAt = new Date();
    } else {
      coupon.usedByUsers.push({
        user: new Types.ObjectId(userId),
        count: 1,
        usedAt: new Date(),
      });
    }

    await coupon.save();
  }

  async getAllCoupons(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const coupons = await this.couponModel
      .find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.couponModel.countDocuments();

    return {
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCouponById(id: string): Promise<Coupon> {
    const coupon = await this.couponModel
      .findById(id)
      .populate('createdBy', 'name email');

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async updateCoupon(id: string, updateData: Partial<CreateCouponDto>): Promise<Coupon> {
    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    const result = await this.couponModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Coupon not found');
    }
  }

  async getActiveCoupons(): Promise<Coupon[]> {
    const now = new Date();
    return this.couponModel.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: 0 },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
    });
  }
}