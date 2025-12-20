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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VendorStatus } from './schemas/vendor.schema';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('documents', 10, {
    storage: diskStorage({
      destination: './uploads/vendor-documents',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      // Support more image formats and PDF
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|bmp|tiff|svg\+xml|pdf)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG) and PDF files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async applyAsVendor(
    @Request() req,
    @Body() createVendorDto: CreateVendorDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Handle file uploads for documents (files might be undefined if no files uploaded)
    const documents = {
      businessLicense: files?.find(f => f.fieldname === 'businessLicense')?.filename || createVendorDto.documents?.businessLicense || '',
      taxCertificate: files?.find(f => f.fieldname === 'taxCertificate')?.filename || createVendorDto.documents?.taxCertificate || '',
      identityProof: files?.find(f => f.fieldname === 'identityProof')?.filename || createVendorDto.documents?.identityProof || '',
      addressProof: files?.find(f => f.fieldname === 'addressProof')?.filename || createVendorDto.documents?.addressProof || '',
    };

    return this.vendorsService.createVendorApplication(req.user.userId, {
      ...createVendorDto,
      documents,
    });
  }

  @Post('fix-missing/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async fixMissingVendorApplication(@Param('userId') userId: string) {
    return this.vendorsService.createMissingVendorApplication(userId);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getPendingVendors(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.vendorsService.getPendingVendors(page, limit);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllVendors(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('status') status?: VendorStatus,
  ) {
    return this.vendorsService.getAllVendors(page, limit, status);
  }

  @Get('search')
  async searchVendors(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.vendorsService.searchVendors(query, page, limit);
  }

  @Get('my-profile')
  @UseGuards(JwtAuthGuard)
  async getMyVendorProfile(@Request() req) {
    return this.vendorsService.getVendorByUserId(req.user.userId);
  }

  @Put('my-profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        // Different destinations for different file types
        if (file.fieldname === 'shopBackgroundImage') {
          cb(null, './uploads/shop-backgrounds');
        } else {
          cb(null, './uploads/vendor-profiles');
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      // Support more image formats and PDF
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|bmp|tiff|svg\+xml|pdf)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG) and PDF files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async updateMyProfile(
    @Request() req,
    @Body() updateData: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.vendorsService.updateVendorProfileByUserId(req.user.userId, updateData, files);
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  async getMyStats(@Request() req) {
    const vendor = await this.vendorsService.getVendorByUserId(req.user.userId);
    return this.vendorsService.getVendorStats((vendor as any)._id);
  }

  @Get(':id')
  async getVendorById(@Param('id') id: string) {
    return this.vendorsService.getVendorById(id);
  }

  @Get(':id/stats')
  async getVendorStats(@Param('id') id: string) {
    return this.vendorsService.getVendorStats(id);
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async approveVendor(@Param('id') id: string, @Request() req) {
    return this.vendorsService.approveVendor(id, req.user.userId);
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async rejectVendor(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.vendorsService.rejectVendor(id, req.user.userId, reason);
  }

  @Put(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async suspendVendor(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.vendorsService.suspendVendor(id, req.user.userId, reason);
  }

  @Put(':id/unsuspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async unsuspendVendor(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.vendorsService.unsuspendVendor(id, req.user.userId);
  }

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor', 'admin')
  async updateVendorProfile(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateVendorDto>,
    @Request() req,
  ) {
    // Vendors can only update their own profile
    if (req.user.role === 'vendor') {
      const vendor = await this.vendorsService.getVendorByUserId(req.user.userId);
      if ((vendor as any)._id.toString() !== id) {
        throw new Error('Unauthorized');
      }
    }

    return this.vendorsService.updateVendorProfile(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteVendor(@Param('id') id: string) {
    await this.vendorsService.deleteVendor(id);
    return { message: 'Vendor deleted successfully' };
  }
}