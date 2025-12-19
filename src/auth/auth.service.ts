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
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('User') private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
    ) { }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async register(registerDto: RegisterDto) {
        const { name, email, password, confirmPassword, role, vendorDetails } = registerDto;

        // Check if passwords match
        if (password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        // Check if user already exists
        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP for email verification
        const otp = this.generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user (vendor details are optional)
        const user = new this.userModel({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            vendorDetails: role === 'vendor' && vendorDetails ? vendorDetails : null,
            isApproved: role === 'vendor' ? false : true,
            isEmailVerified: false,
            emailVerificationOtp: otp,
            emailVerificationOtpExpires: otpExpires,
        });

        await user.save();

        // Send OTP email
        await this.emailService.sendOtpEmail(email, otp);

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
                isEmailVerified: user.isEmailVerified,
            },
            message: 'Registration successful. Please verify your email with the OTP sent.',
            ...tokens,
        };
    }

    async sendVerificationOtp(email: string) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        const otp = this.generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.emailVerificationOtp = otp;
        user.emailVerificationOtpExpires = otpExpires;
        await user.save();

        await this.emailService.sendOtpEmail(email, otp);

        return { message: 'OTP sent to your email' };
    }

    async verifyEmail(email: string, otp: string) {
        const user = await this.userModel.findOne({
            email,
            emailVerificationOtp: otp,
            emailVerificationOtpExpires: { $gt: new Date() },
        }).exec();

        if (!user) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        user.isEmailVerified = true;
        user.emailVerificationOtp = null;
        user.emailVerificationOtpExpires = null;
        await user.save();

        return { message: 'Email verified successfully' };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.userModel.findOne({ email }).exec();
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
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: null }).exec();
        return { message: 'Logged out successfully' };
    }

    async refreshTokens(refreshToken: string) {
        try {
            const secret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-secret';
            const payload = await this.jwtService.verifyAsync(refreshToken, { secret });
            const userId = payload.sub;

            const user = await this.userModel.findById(userId).exec();
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
        const user = await this.userModel.findByIdAndUpdate(userId, { isApproved: true }, { new: true }).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return { message: 'Vendor approved successfully' };
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const { email } = forgotPasswordDto;

        const user = await this.userModel.findOne({ email }).exec();
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
        }).exec();

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
        const user = await this.userModel.findById(userId).select('-password -refreshToken -resetPasswordToken -emailVerificationOtp -otp').exec();
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            addresses: user.addresses || [],
            vendorDetails: user.vendorDetails || null,
        };
    }

    async findAllUsers() {
        return this.userModel.find().select('-password -refreshToken -resetPasswordToken').exec();
    }

    private async generateTokens(userId: string, email: string, role: string): Promise<{ accessToken: string; refreshToken: string }> {
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
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashedRefreshToken }).exec();
    }
    async addAddress(userId: string, addressData: any) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new NotFoundException('User not found');

        if (addressData.isDefault) {
            // Unset other defaults
            user.addresses.forEach(addr => addr.isDefault = false);
        } else if (user.addresses.length === 0) {
            // First address is always default
            addressData.isDefault = true;
        }

        user.addresses.push(addressData);
        await user.save();
        return user.addresses;
    }

    async removeAddress(userId: string, addressId: string) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new NotFoundException('User not found');

        user.addresses = user.addresses.filter(addr => (addr as any)._id.toString() !== addressId);
        await user.save();
        return user.addresses;
    }

    async setDefaultAddress(userId: string, addressId: string) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new NotFoundException('User not found');

        user.addresses.forEach(addr => {
            addr.isDefault = (addr as any)._id.toString() === addressId;
        });

        await user.save();
        return user.addresses;
    }
    async googleLogin(reqUser: any) {
        if (!reqUser) {
            throw new BadRequestException('No user from google');
        }

        const { email, firstName, lastName } = reqUser;
        let user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            // Create new user
            const password = Math.random().toString(36).slice(-8); // Random password
            const hashedPassword = await bcrypt.hash(password, 10);

            user = new this.userModel({
                name: `${firstName} ${lastName}`,
                email,
                password: hashedPassword,
                role: 'user',
                isApproved: true,
            });
            await user.save();
        }

        const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);
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
}
