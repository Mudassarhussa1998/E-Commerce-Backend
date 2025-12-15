import { IsNotEmpty, IsString, IsNumber, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  comment: string;
}