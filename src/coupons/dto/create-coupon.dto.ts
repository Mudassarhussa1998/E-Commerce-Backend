import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsDate,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CouponType } from '../schemas/coupon.schema';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Transform(({ value }) => value.toUpperCase())
  code: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscountAmount?: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableProducts?: string[];

  @IsOptional()
  @IsBoolean()
  isFirstTimeUser?: boolean;
}

export class ValidateCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  orderAmount: number;

  @IsOptional()
  @IsArray()
  cartItems?: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}