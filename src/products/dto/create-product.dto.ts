import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';

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
    @IsEnum(['Chairs', 'Sofas', 'Tables', 'Beds', 'Storage'])
    category: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    stock: number;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsBoolean()
    isNew?: boolean;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;
}
