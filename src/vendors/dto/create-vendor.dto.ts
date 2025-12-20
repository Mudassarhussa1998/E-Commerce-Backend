import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsObject,
  ValidateNested,
  IsArray,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  zipCode: string;

  @IsNotEmpty()
  @IsString()
  country: string;
}

class BankDetailsDto {
  @IsNotEmpty()
  @IsString()
  accountHolderName: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  bankName: string;

  @IsNotEmpty()
  @IsString()
  ifscCode: string;

  @IsNotEmpty()
  @IsString()
  branchName: string;
}

class TaxDetailsDto {
  @IsNotEmpty()
  @IsString()
  gstNumber: string;

  @IsNotEmpty()
  @IsString()
  panNumber: string;
}

class DocumentsDto {
  @IsNotEmpty()
  @IsString()
  businessLicense: string;

  @IsNotEmpty()
  @IsString()
  taxCertificate: string;

  @IsNotEmpty()
  @IsString()
  identityProof: string;

  @IsNotEmpty()
  @IsString()
  addressProof: string;
}

export class CreateVendorDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  shopName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName: string;

  @IsNotEmpty()
  @IsString()
  businessType: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  contactPerson: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  alternatePhone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  businessAddress: AddressDto;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  pickupAddress: AddressDto;

  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails: BankDetailsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => TaxDetailsDto)
  taxDetails: TaxDetailsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DocumentsDto)
  documents: DocumentsDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  shopDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsNumber()
  establishedYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  socialLinks?: string[];
}