import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Request
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    getWishlist(@Request() req) {
        return this.wishlistService.getWishlist(req.user.userId);
    }

    @Post('toggle')
    toggleWishlist(@Request() req, @Body() toggleWishlistDto: ToggleWishlistDto) {
        return this.wishlistService.toggleWishlist(req.user.userId, toggleWishlistDto.productId);
    }

    @Delete(':productId')
    removeFromWishlist(@Request() req, @Param('productId') productId: string) {
        return this.wishlistService.removeFromWishlist(req.user.userId, productId);
    }

    @Get('check/:productId')
    isInWishlist(@Request() req, @Param('productId') productId: string) {
        return this.wishlistService.isInWishlist(req.user.userId, productId);
    }
}
