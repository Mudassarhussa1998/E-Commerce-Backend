import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

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

    @IsString()
    role?: string;

    vendorDetails?: {
        businessName: string;
        address: string;
        phone: string;
        taxId: string;
        description: string;
    };
}
