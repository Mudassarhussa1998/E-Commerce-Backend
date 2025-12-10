import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
    @IsNotEmpty()
    @IsEnum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    status: string;
}
