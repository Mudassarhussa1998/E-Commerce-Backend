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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailService } from '../email/email.service';
import { Vendor, VendorDocument, VendorStatus } from '../vendors/schemas/vendor.schema';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('User') private userModel: Model<UserDocument>,
        @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
    ) { }

    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async createVendorApplicationFromSignup(userId: string, name: string, email: string, vendorDetails?: any) {
        try {
            // Check if vendor application already exists
            const existingVendor = await this.vendorModel.findOne({ user: userId });
            if (existingVendor) {
                return existingVendor;
            }

            // Create vendor application with data from signup form
            const vendor = new this.vendorModel({
                user: userId,
                shopName: vendorDetails?.businessName || `${name}'s Shop`,
                businessName: vendorDetails?.businessName || `${name} Business`,
                businessType: 'Individual',
                contactPerson: name,
                phoneNumber: vendorDetails?.phone || '+1234567890',
                alternatePhone: '+0987654321',
                email: email,
                businessAddress: {
                    street: vendorDetails?.address || 'Please update your business address',
                    city: 'City',
                    state: 'State',
                    zipCode: '00000',
                    country: 'Country',
                },
                pickupAddress: {
                    street: vendorDetails?.address || 'Please update your pickup address',
                    city: 'City',
                    state: 'State',
                    zipCode: '00000',
                    country: 'Country',
                },
                bankDetails: {
                    accountHolderName: name,
                    accountNumber: 'Please update',
                    bankName: 'Please update',
                    ifscCode: 'Please update',
                    branchName: 'Please update',
                },
                taxDetails: {
                    gstNumber: vendorDetails?.taxId || 'Please update',
                    panNumber: 'Please update',
                },
                documents: {
                    businessLicense: 'pending',
                    taxCertificate: 'pending',
                    identityProof: 'pending',
                    addressProof: 'pending',
                },
                status: VendorStatus.PENDING,
            });

            const savedVendor = await vendor.save();

            // Send notification email to admin
            await this.emailService.sendVendorApplicationNotification(
                email,
                name,
                vendorDetails?.businessName || `${name}'s Shop`,
            );

            return savedVendor;
        } catch (error) {
            console.error('Error creating vendor application from signup:', error);
            // Don't throw error to prevent signup failure
            return null;
        }
    }

    async vendorRegister(registerDto: any, files: Express.Multer.File[]) {
        const { name, email, password, confirmPassword, vendorDetails } = registerDto;

        // Parse vendorDetails if it's a string
        const parsedVendorDetails = typeof vendorDetails === 'string'
            ? JSON.parse(vendorDetails)
            : vendorDetails;

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

        // Create user
        const user = new this.userModel({
            name,
            email,
            password: hashedPassword,
            role: 'vendor',
            isApproved: false,
            isEmailVerified: false,
            emailVerificationOtp: otp,
            emailVerificationOtpExpires: otpExpires,
        });

        await user.save();

        // Process uploaded files
        const documentPaths: Record<string, string> = {};
        if (files && files.length > 0) {
            files.forEach(file => {
                documentPaths[file.fieldname] = file.filename;
            });
        }

        // Create detailed vendor application
        const vendor = new this.vendorModel({
            user: user._id,
            shopName: parsedVendorDetails.shopName,
            businessName: parsedVendorDetails.businessName,
            businessType: parsedVendorDetails.businessType || 'Individual',
            businessCategory: parsedVendorDetails.businessCategory,
            businessDescription: parsedVendorDetails.businessDescription,
            establishedYear: parsedVendorDetails.establishedYear,
            contactPerson: name,
            phoneNumber: parsedVendorDetails.phoneNumber,
            alternatePhone: parsedVendorDetails.alternatePhone,
            email: email,
            cnicNumber: parsedVendorDetails.cnicNumber,
            dateOfBirth: parsedVendorDetails.dateOfBirth,
            businessAddress: parsedVendorDetails.businessAddress,
            pickupAddress: parsedVendorDetails.pickupAddress,
            bankDetails: parsedVendorDetails.bankDetails,
            taxDetails: parsedVendorDetails.taxDetails,
            documents: {
                businessLicense: documentPaths.businessLicense || 'pending',
                taxCertificate: documentPaths.taxCertificate || 'pending',
                identityProof: documentPaths.cnicFrontPhoto || 'pending',
                addressProof: documentPaths.cnicBackPhoto || 'pending',
                personalPhoto: documentPaths.personalPhoto || 'pending',
                cnicFrontPhoto: documentPaths.cnicFrontPhoto || 'pending',
                cnicBackPhoto: documentPaths.cnicBackPhoto || 'pending',
            },
            status: VendorStatus.PENDING,
        });

        await vendor.save();

        // Send OTP email
        await this.emailService.sendOtpEmail(email, otp);

        // Send notification email to admin
        await this.emailService.sendVendorApplicationNotification(
            email,
            name,
            parsedVendorDetails.shopName,
        );

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
                isApproved: user.isApproved,
                isEmailVerified: user.isEmailVerified,
            },
            message: 'Vendor registration successful. Please verify your email with the OTP sent.',
            ...tokens,
        };
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

        // If user registered as vendor, create vendor application automatically
        if (role === 'vendor') {
            await this.createVendorApplicationFromSignup(user._id.toString(), name, email, vendorDetails);
        }

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

        // Allow vendors to login even if not approved, but include approval status
        // if (user.role === 'vendor' && !user.isApproved) {
        //     throw new UnauthorizedException('Your vendor account is pending approval');
        // }

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
                isApproved: user.isApproved,
                isEmailVerified: user.isEmailVerified,
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

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        // If email is being updated, check if it's already taken
        if (updateProfileDto.email) {
            const existingUser = await this.userModel.findOne({
                email: updateProfileDto.email,
                _id: { $ne: userId }
            }).exec();

            if (existingUser) {
                throw new ConflictException('Email already in use');
            }
        }

        const user = await this.userModel.findByIdAndUpdate(
            userId,
            { $set: updateProfileDto },
            { new: true }
        ).select('-password -refreshToken -otp -emailVerificationOtp').exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

        if (newPassword !== confirmNewPassword) {
            throw new BadRequestException('New passwords do not match');
        }

        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid current password');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return { message: 'Password changed successfully' };
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
            isApproved: user.isApproved,
            isEmailVerified: user.isEmailVerified,
            addresses: user.addresses || [],
            vendorDetails: null,
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

    async blockUser(userId: string, adminId: string, reason: string) {
        const user = await this.userModel.findByIdAndUpdate(
            userId,
            {
                status: 'blocked',
                blockedBy: adminId,
                blockReason: reason,
                blockedAt: new Date(),
            },
            { new: true }
        ).exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return { message: 'User blocked successfully', user };
    }

    async unblockUser(userId: string, adminId: string) {
        const user = await this.userModel.findByIdAndUpdate(
            userId,
            {
                status: 'active',
                blockedBy: null,
                blockReason: null,
                blockedAt: null,
            },
            { new: true }
        ).exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return { message: 'User unblocked successfully', user };
    }
}
