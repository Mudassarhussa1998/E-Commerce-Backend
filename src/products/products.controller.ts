import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Request
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    create(@Body() createProductDto: CreateProductDto, @Request() req) {
        // Assign the logged-in user (admin or vendor) as the vendor of the product
        const productData = {
            ...createProductDto,
            vendor: req.user.userId
        };
        return this.productsService.create(productData);
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
        }),
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        return {
            url: `/uploads/${file.filename}`,
        };
    }

    @Get()
    findAll(@Query() filterDto: FilterProductDto) {
        return this.productsService.findAll(filterDto);
    }

    @Get('search/suggestions')
    getSearchSuggestions(@Query('q') query: string, @Query('limit') limit?: number) {
        return this.productsService.getSearchSuggestions(query, limit ? Number(limit) : 5);
    }

    @Get('search/popular-terms')
    getPopularSearchTerms() {
        return this.productsService.getPopularSearchTerms();
    }

    @Get('filters/options')
    getFilterOptions() {
        return this.productsService.getFilterOptions();
    }

    @Get('featured')
    findFeatured() {
        return this.productsService.findFeatured();
    }

    @Get('vendor/me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('vendor')
    async getVendorProducts(@Request() req) {
        // We need to add a method in service to find by vendor
        return this.productsService.findByVendor(req.user.userId);
    }

    @Get('new')
    findNew() {
        return this.productsService.findNew();
    }

    @Get('category/:category')
    findByCategory(@Param('category') category: string) {
        return this.productsService.findByCategory(category);
    }

    @Get(':id/recommendations')
    getRecommendations(@Param('id') id: string) {
        return this.productsService.getRecommendations(id);
    }

    @Get(':id/related')
    getRelatedProducts(@Param('id') id: string, @Query('limit') limit?: number) {
        return this.productsService.getRelatedProducts(id, limit ? Number(limit) : 4);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    @UseInterceptors(FilesInterceptor('images', 5, {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
        }),
    }))
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req, @UploadedFiles() files?: Express.Multer.File[]) {
        return this.productsService.update(id, updateProductDto, req.user.userId, req.user.role, files);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendor')
    remove(@Param('id') id: string, @Request() req) {
        return this.productsService.remove(id, req.user.userId, req.user.role);
    }

    @Patch(':id/approve')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async approveProduct(@Param('id') id: string, @Request() req) {
        return this.productsService.approveProduct(id, req.user.userId);
    }

    @Patch(':id/reject')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async rejectProduct(@Param('id') id: string, @Request() req) {
        return this.productsService.rejectProduct(id, req.user.userId);
    }
}
