import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/create-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createCoupon(@Body() createCouponDto: CreateCouponDto, @Request() req) {
    return this.couponsService.createCoupon(createCouponDto, req.user.id);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validateCoupon(@Body() validateCouponDto: ValidateCouponDto, @Request() req) {
    return this.couponsService.validateCoupon(validateCouponDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllCoupons(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.couponsService.getAllCoupons(page, limit);
  }

  @Get('active')
  async getActiveCoupons() {
    return this.couponsService.getActiveCoupons();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getCouponById(@Param('id') id: string) {
    return this.couponsService.getCouponById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateCoupon(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCouponDto>,
  ) {
    return this.couponsService.updateCoupon(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteCoupon(@Param('id') id: string) {
    await this.couponsService.deleteCoupon(id);
    return { message: 'Coupon deleted successfully' };
  }
}