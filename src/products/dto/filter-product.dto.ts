import { IsOptional, IsString, IsBoolean, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterProductDto {
    @IsOptional()
    @IsEnum(['Chairs', 'Sofas', 'Tables', 'Beds', 'Storage'])
    category?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isNew?: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isFeatured?: boolean;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxPrice?: number;
}
