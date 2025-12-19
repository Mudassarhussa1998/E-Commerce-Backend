import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Param, Delete, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

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
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req) {
        return this.authService.logout(req.user.userId);
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
