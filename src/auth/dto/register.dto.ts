import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class VendorDetailsDto {
    @IsOptional()
    @IsString()
    businessName?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    taxId?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    confirmPassword: string;

    @IsOptional()
    @IsString()
    @IsIn(['user', 'vendor', 'admin'])
    role?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => VendorDetailsDto)
    vendorDetails?: VendorDetailsDto;
}
