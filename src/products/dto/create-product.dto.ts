import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, IsArray } from 'class-validator';
import { TopCategory, SubCategory } from '../schemas/product.schema';

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    subtitle: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    originalPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discount?: number;

    @IsNotEmpty()
    @IsEnum(TopCategory)
    topCategory: TopCategory;

    @IsNotEmpty()
    @IsEnum(SubCategory)
    subCategory: SubCategory;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    colors?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    sizes?: string[];

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    stock: number;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsBoolean()
    isNew?: boolean;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsString()
    vendor?: string;

    @IsOptional()
    @IsString()
    material?: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsEnum(['Male', 'Female', 'Unisex'])
    gender?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsNumber()
    weight?: number;

    @IsOptional()
    @IsBoolean()
    isApproved?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}