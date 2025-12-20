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
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportDto, AddCommentDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportStatus, ReportType } from './schemas/report.schema';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReport(@Request() req, @Body() createReportDto: CreateReportDto) {
    return this.reportsService.createReport(req.user.id, createReportDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllReports(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('status') status?: ReportStatus,
    @Query('type') type?: ReportType,
    @Query('priority') priority?: string,
  ) {
    return this.reportsService.getAllReports(page, limit, status, type, priority);
  }

  @Get('my-reports')
  @UseGuards(JwtAuthGuard)
  async getUserReports(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.reportsService.getUserReports(req.user.id, page, limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getReportStats() {
    return this.reportsService.getReportStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getReportById(@Param('id') id: string, @Request() req) {
    const report = await this.reportsService.getReportById(id);
    
    // Only allow admin or the reporter to view the report
    if (req.user.role !== 'admin' && report.reportedBy.toString() !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return report;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateReport(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
    @Request() req,
  ) {
    return this.reportsService.updateReport(id, updateReportDto, req.user.id);
  }

  @Put(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async assignReport(
    @Param('id') id: string,
    @Body('assignToId') assignToId: string,
    @Request() req,
  ) {
    return this.reportsService.assignReport(id, req.user.id, assignToId);
  }

  @Put(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async resolveReport(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @Request() req,
  ) {
    return this.reportsService.resolveReport(id, resolution, req.user.id);
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async rejectReport(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.reportsService.rejectReport(id, reason, req.user.id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') id: string,
    @Body() addCommentDto: AddCommentDto,
    @Request() req,
  ) {
    return this.reportsService.addComment(id, addCommentDto, req.user.id);
  }

  @Post(':id/upvote')
  @UseGuards(JwtAuthGuard)
  async upvoteReport(@Param('id') id: string, @Request() req) {
    return this.reportsService.upvoteReport(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReport(@Param('id') id: string, @Request() req) {
    const isAdmin = req.user.role === 'admin';
    await this.reportsService.deleteReport(id, req.user.id, isAdmin);
    return { message: 'Report deleted successfully' };
  }
}