import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AddAddressDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    streetAddress: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    province: string;

    @IsString()
    @IsNotEmpty()
    zipCode: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
