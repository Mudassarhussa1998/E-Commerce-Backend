import {
    IsNotEmpty,
    IsString,
    IsEmail,
    IsEnum,
    IsOptional,
    ValidateNested,
    IsArray
} from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    companyName?: string;

    @IsNotEmpty()
    @IsString()
    country: string;

    @IsNotEmpty()
    @IsString()
    streetAddress: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    province: string;

    @IsNotEmpty()
    @IsString()
    zipCode: string;

    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;
}

export class CreateOrderDto {
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => ShippingAddressDto)
    shippingAddress: ShippingAddressDto;

    @IsOptional()
    @IsString()
    additionalInfo?: string;

    @IsNotEmpty()
    @IsEnum(['bank', 'cod', 'stripe', 'paypal'])
    paymentMethod: string;

    @IsOptional()
    @IsString()
    couponCode?: string;

    @IsOptional()
    discountAmount?: number;
}
