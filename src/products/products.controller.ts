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
    Request
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    create(@Body() createProductDto: CreateProductDto, @Request() req) {
        // Assign the logged-in user (admin or vendor) as the vendor of the product
        const productData = {
            ...createProductDto,
            vendor: req.user.userId
        };
        return this.productsService.create(productData);
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard, AdminGuard)
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

    @Get('featured')
    findFeatured() {
        return this.productsService.findFeatured();
    }

    @Get('vendor/me')
    @UseGuards(JwtAuthGuard, AdminGuard)
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

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
