import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { name, email, password, confirmPassword, role, vendorDetails } = registerDto;

        // Check if passwords match
        if (password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        // Check if user already exists
        const existingUser = await this.userModel.findOne({ email });
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new this.userModel({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            vendorDetails: role === 'vendor' ? vendorDetails : null,
            isApproved: role === 'vendor' ? false : true,
        });

        await user.save();

        // Generate tokens
        const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

        // Save refresh token
        await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.role === 'vendor' && !user.isApproved) {
            throw new UnauthorizedException('Your vendor account is pending approval');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

        // Save refresh token
        await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        };
    }

    async logout(userId: string) {
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
        return { message: 'Logged out successfully' };
    }

    async refreshTokens(refreshToken: string) {
        try {
            const secret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-secret';
            const payload = await this.jwtService.verifyAsync(refreshToken, { secret });
            const userId = payload.sub;

            const user = await this.userModel.findById(userId);
            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Access denied');
            }

            const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Access denied');
            }

            const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
            await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

            return tokens;
        } catch (e) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async approveVendor(userId: string) {
        const user = await this.userModel.findByIdAndUpdate(userId, { isApproved: true }, { new: true });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return { message: 'Vendor approved successfully' };
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const { email } = forgotPasswordDto;

        const user = await this.userModel.findOne({ email });
        if (!user) {
            // Don't reveal if user exists
            return { message: 'If the email exists, a reset link has been sent' };
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP with expiration (10 minutes)
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 600000); // 10 minutes
        await user.save();

        // TODO: Send email with OTP
        console.log(`OTP for ${email}: ${otp}`);

        return {
            message: 'OTP sent to your email',
        };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { email, otp, password, confirmPassword } = resetPasswordDto;

        if (password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const user = await this.userModel.findOne({
            email,
            otp,
            otpExpires: { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear OTP
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        return { message: 'Password reset successfully' };
    }

    async getProfile(userId: string) {
        const user = await this.userModel.findById(userId).select('-password -refreshToken -resetPasswordToken');
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }

    async findAllUsers() {
        return this.userModel.find().select('-password -refreshToken -resetPasswordToken');
    }

    private async generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-secret';
        const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-secret';
        const accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
        const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: accessSecret,
                expiresIn: accessExpiration,
            } as any),
            this.jwtService.signAsync(payload, {
                secret: refreshSecret,
                expiresIn: refreshExpiration,
            } as any),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private async updateRefreshToken(userId: string, refreshToken: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashedRefreshToken });
    }
}
