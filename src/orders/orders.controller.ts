import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Request
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(req.user.userId, createOrderDto);
    }

    @Get()
    findByUser(@Request() req) {
        return this.ordersService.findByUser(req.user.userId);
    }

    @Get('vendor/me')
    @UseGuards(RolesGuard)
    @Roles('vendor')
    findByVendor(@Request() req) {
        return this.ordersService.findByVendor(req.user.userId);
    }

    @Get('all')
    @UseGuards(AdminGuard)
    findAll() {
        return this.ordersService.findAll();
    }

    @Get('analytics')
    @UseGuards(AdminGuard)
    getAnalytics() {
        return this.ordersService.getAnalytics();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/status')
    @UseGuards(AdminGuard)
    updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(id, updateOrderStatusDto);
    }

    @Post('track')
    @Public()
    trackOrder(@Body() body: { orderId: string; email: string }) {
        return this.ordersService.trackOrder(body.orderId, body.email);
    }
}
