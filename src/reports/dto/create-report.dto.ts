import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ReportType, ReportPriority } from '../schemas/report.schema';

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsString()
  reportedUser?: string;

  @IsOptional()
  @IsString()
  reportedVendor?: string;

  @IsOptional()
  @IsString()
  reportedProduct?: string;

  @IsOptional()
  @IsString()
  relatedOrder?: string;

  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AddCommentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsOptional()
  isInternal?: boolean;
}