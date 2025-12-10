import { IsNotEmpty, IsString, Mimport { IsString, MinLength, IsEmail, MaxLength } from 'class-validator';

export class ResetPasswordDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(6)
    otp: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    confirmPassword: string;
}
