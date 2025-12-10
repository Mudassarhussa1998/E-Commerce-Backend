import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Request() req) {
        return this.cartService.getCart(req.user.userId);
    }

    @Post('items')
    addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
        return this.cartService.addToCart(req.user.userId, addToCartDto);
    }

    @Patch('items/:productId')
    updateCartItem(
        @Request() req,
        @Param('productId') productId: string,
        @Body() updateCartItemDto: UpdateCartItemDto,
    ) {
        return this.cartService.updateCartItem(req.user.userId, productId, updateCartItemDto);
    }

    @Delete('items/:productId')
    removeFromCart(@Request() req, @Param('productId') productId: string) {
        return this.cartService.removeFromCart(req.user.userId, productId);
    }

    @Delete()
    clearCart(@Request() req) {
        return this.cartService.clearCart(req.user.userId);
    }

    @Get('total')
    getCartTotal(@Request() req) {
        return this.cartService.getCartTotal(req.user.userId);
    }
}
