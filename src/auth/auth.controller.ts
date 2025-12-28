import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Param, Delete, Res, UseInterceptors, UploadedFiles, Patch } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    @Post('vendor-register')
    @UseInterceptors(FilesInterceptor('files', 10, {
        storage: diskStorage({
            destination: './uploads/vendor-documents',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
            },
        }),
        fileFilter: (req, file, cb) => {
            // Support more image formats: jpg, jpeg, png, gif, webp, bmp, tiff, svg, and pdf
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
    async vendorRegister(@Body() registerDto: any, @UploadedFiles() files: Express.Multer.File[]) {
        // Handle the detailed vendor registration with file uploads
        return this.authService.vendorRegister(registerDto, files);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req) {
        // Try to get userId from token if available, but don't require it
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const decoded = require('jsonwebtoken').decode(token);
                if (decoded?.sub) {
                    return this.authService.logout(decoded.sub);
                }
            }
        } catch (error) {
            // Token invalid or expired, just return success
        }
        return { message: 'Logged out successfully' };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Body() body: { refreshToken: string }) {
        return this.authService.refreshTokens(body.refreshToken);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Post('send-verification-otp')
    @HttpCode(HttpStatus.OK)
    async sendVerificationOtp(@Body() body: { email: string }) {
        return this.authService.sendVerificationOtp(body.email);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Body() body: { email: string; otp: string }) {
        return this.authService.verifyEmail(body.email, body.otp);
    }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.userId, updateProfileDto);
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.userId, changePasswordDto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }

    @Get('users')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getUsers() {
        return this.authService.findAllUsers();
    }

    @Post('approve/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async approveVendor(@Param('id') id: string) {
        return this.authService.approveVendor(id);
    }

    @Post('users/:id/block')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async blockUser(@Param('id') id: string, @Body('reason') reason: string, @Request() req) {
        return this.authService.blockUser(id, req.user.userId, reason);
    }

    @Post('users/:id/unblock')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async unblockUser(@Param('id') id: string, @Request() req) {
        return this.authService.unblockUser(id, req.user.userId);
    }

    @Post('address')
    @UseGuards(JwtAuthGuard)
    async addAddress(@Request() req, @Body() addressData: any) {
        return this.authService.addAddress(req.user.userId, addressData);
    }

    @Delete('address/:id')
    @UseGuards(JwtAuthGuard)
    async removeAddress(@Request() req, @Param('id') id: string) {
        return this.authService.removeAddress(req.user.userId, id);
    }

    @Post('address/:id/default')
    @UseGuards(JwtAuthGuard)
    async setDefaultAddress(@Request() req, @Param('id') id: string) {
        return this.authService.setDefaultAddress(req.user.userId, id);
    }
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthRedirect(@Request() req, @Res() res) {
        const data = await this.authService.googleLogin(req.user);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        // Redirect to frontend with tokens
        res.redirect(`${frontendUrl}/auth/callback?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`);
    }
}
