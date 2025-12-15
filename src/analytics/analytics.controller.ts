import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('sales-chart')
  async getSalesChart(@Query('period') period: 'week' | 'month' | 'year' = 'month') {
    return this.analyticsService.getSalesChart(period);
  }

  @Get('top-products')
  async getTopProducts(@Query('limit') limit = 10) {
    return this.analyticsService.getTopProducts(Number(limit));
  }

  @Get('categories')
  async getCategoryStats() {
    return this.analyticsService.getCategoryStats();
  }

  @Get('customers')
  async getCustomerStats() {
    return this.analyticsService.getCustomerStats();
  }

  @Get('order-status')
  async getOrderStatusStats() {
    return this.analyticsService.getOrderStatusStats();
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit = 20) {
    return this.analyticsService.getRecentActivity(Number(limit));
  }
}