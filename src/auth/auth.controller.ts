import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

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
}
