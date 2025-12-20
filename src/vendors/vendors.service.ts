import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vendor, VendorDocument, VendorStatus } from './schemas/vendor.schema';
import { User, UserDocument, UserRole } from '../auth/schemas/user.schema';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) {}

  async createVendorApplication(
    userId: string,
    createVendorDto: CreateVendorDto,
  ): Promise<Vendor> {
    // Check if user already has a vendor application
    const existingVendor = await this.vendorModel.findOne({ user: userId });
    if (existingVendor) {
      throw new ConflictException('Vendor application already exists');
    }

    // Check if shop name is already taken
    const existingShopName = await this.vendorModel.findOne({
      shopName: createVendorDto.shopName,
    });
    if (existingShopName) {
      throw new ConflictException('Shop name already exists');
    }

    const vendor = new this.vendorModel({
      user: userId,
      ...createVendorDto,
      status: VendorStatus.PENDING,
    });

    const savedVendor = await vendor.save();

    // Update user role to vendor and set isApproved to false
    await this.userModel.findByIdAndUpdate(userId, {
      role: UserRole.VENDOR,
      isApproved: false,
    });

    // Send notification email to admin
    await this.emailService.sendVendorApplicationNotification(
      createVendorDto.email,
      createVendorDto.contactPerson,
      createVendorDto.shopName,
    );

    return savedVendor.populate('user', 'name email');
  }

  async createMissingVendorApplication(userId: string) {
    // Check if user exists and is a vendor
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.role !== UserRole.VENDOR) {
      throw new BadRequestException('User is not a vendor');
    }

    // Check if vendor application already exists
    const existingVendor = await this.vendorModel.findOne({ user: userId });
    if (existingVendor) {
      return existingVendor.populate('user', 'name email');
    }

    // Create a basic vendor application
    const vendor = new this.vendorModel({
      user: userId,
      shopName: `${user.name}'s Shop`,
      businessName: `${user.name} Business`,
      businessType: 'Individual',
      contactPerson: user.name,
      phoneNumber: '+1234567890',
      alternatePhone: '+0987654321',
      email: user.email,
      businessAddress: {
        street: 'Please update your business address',
        city: 'City',
        state: 'State',
        zipCode: '00000',
        country: 'Country',
      },
      pickupAddress: {
        street: 'Please update your pickup address',
        city: 'City',
        state: 'State',
        zipCode: '00000',
        country: 'Country',
      },
      bankDetails: {
        accountHolderName: user.name,
        accountNumber: 'Please update',
        bankName: 'Please update',
        ifscCode: 'Please update',
        branchName: 'Please update',
      },
      taxDetails: {
        gstNumber: 'Please update',
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
      user.email,
      user.name,
      `${user.name}'s Shop`,
    );

    return savedVendor.populate('user', 'name email');
  }

  async getPendingVendors(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const vendors = await this.vendorModel
      .find({ status: VendorStatus.PENDING })
      .populate('user', 'name email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.vendorModel.countDocuments({
      status: VendorStatus.PENDING,
    });

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAllVendors(page = 1, limit = 10, status?: VendorStatus) {
    const skip = (page - 1) * limit;
    const query = status ? { status } : {};

    const vendors = await this.vendorModel
      .find(query)
      .populate('user', 'name email createdAt')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.vendorModel.countDocuments(query);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorById(vendorId: string): Promise<Vendor> {
    const vendor = await this.vendorModel
      .findById(vendorId)
      .populate('user', 'name email createdAt')
      .populate('approvedBy', 'name email');

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async getVendorByUserId(userId: string): Promise<Vendor> {
    const vendor = await this.vendorModel
      .findOne({ user: userId })
      .populate('user', 'name email');

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async approveVendor(vendorId: string, adminId: string): Promise<Vendor> {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.status !== VendorStatus.PENDING) {
      throw new BadRequestException('Vendor is not in pending status');
    }

    // Update vendor status
    vendor.status = VendorStatus.APPROVED;
    vendor.approvedBy = new Types.ObjectId(adminId);
    vendor.approvedAt = new Date();
    vendor.isActive = true;
    vendor.isVerified = true;

    await vendor.save();

    // Update user role to vendor and set isApproved to true
    await this.userModel.findByIdAndUpdate(vendor.user, {
      role: UserRole.VENDOR,
      isApproved: true,
    });

    // Send approval email
    const user = await this.userModel.findById(vendor.user);
    if (user) {
      await this.emailService.sendVendorApprovalEmail(
        user.email,
        user.name,
        vendor.shopName,
      );
    }

    return vendor.populate('user', 'name email');
  }

  async rejectVendor(
    vendorId: string,
    adminId: string,
    reason: string,
  ): Promise<Vendor> {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.status !== VendorStatus.PENDING) {
      throw new BadRequestException('Vendor is not in pending status');
    }

    vendor.status = VendorStatus.REJECTED;
    vendor.rejectionReason = reason;
    vendor.approvedBy = new Types.ObjectId(adminId);

    await vendor.save();

    // Send rejection email
    const user = await this.userModel.findById(vendor.user);
    if (user) {
      await this.emailService.sendVendorRejectionEmail(
        user.email,
        user.name,
        vendor.shopName,
        reason,
      );
    }

    return vendor.populate('user', 'name email');
  }

  async suspendVendor(
    vendorId: string,
    adminId: string,
    reason: string,
  ): Promise<Vendor> {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.status = VendorStatus.SUSPENDED;
    vendor.rejectionReason = reason;
    vendor.isActive = false;

    await vendor.save();

    // Send suspension email
    const user = await this.userModel.findById(vendor.user);
    if (user) {
      await this.emailService.sendVendorSuspensionEmail(
        user.email,
        user.name,
        vendor.shopName,
        reason,
      );
    }

    return vendor.populate('user', 'name email');
  }

  async unsuspendVendor(
    vendorId: string,
    adminId: string,
  ): Promise<Vendor> {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    vendor.status = VendorStatus.APPROVED;
    vendor.rejectionReason = '';
    vendor.isActive = true;

    await vendor.save();

    // Send unsuspension email
    const user = await this.userModel.findById(vendor.user);
    if (user) {
      await this.emailService.sendVendorUnsuspensionEmail(
        user.email,
        user.name,
        vendor.shopName,
      );
    }

    return vendor.populate('user', 'name email');
  }

  async deleteVendor(vendorId: string): Promise<void> {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Update user role back to user
    await this.userModel.findByIdAndUpdate(vendor.user, {
      role: UserRole.USER,
    });

    await this.vendorModel.findByIdAndDelete(vendorId);
  }

  async updateVendorProfile(
    vendorId: string,
    updateData: Partial<CreateVendorDto>,
  ): Promise<Vendor> {
    const vendor = await this.vendorModel.findByIdAndUpdate(
      vendorId,
      updateData,
      { new: true },
    );

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor.populate('user', 'name email');
  }

  async getVendorStats(vendorId: string) {
    const vendor = await this.vendorModel.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // This would typically involve aggregating data from orders, products, etc.
    // For now, returning basic stats from vendor document
    return {
      totalProducts: vendor.totalProducts,
      totalOrders: vendor.totalOrders,
      averageRating: vendor.averageRating,
      totalReviews: vendor.totalReviews,
      status: vendor.status,
      isActive: vendor.isActive,
      isVerified: vendor.isVerified,
      joinedDate: (vendor as any).createdAt,
    };
  }

  async updateVendorProfileByUserId(
    userId: string,
    updateData: any,
    files?: Express.Multer.File[],
  ): Promise<Vendor> {
    const vendor = await this.vendorModel.findOne({ user: userId });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    // Process uploaded files
    const documentPaths: Record<string, string> = {};
    if (files && files.length > 0) {
      files.forEach(file => {
        if (file.fieldname === 'shopBackgroundImage') {
          documentPaths[file.fieldname] = `/uploads/shop-backgrounds/${file.filename}`;
        } else {
          documentPaths[file.fieldname] = file.filename;
        }
      });
    }

    // Parse nested objects if they're strings
    const parsedData = { ...updateData };
    if (typeof updateData.businessAddress === 'string') {
      parsedData.businessAddress = JSON.parse(updateData.businessAddress);
    }
    if (typeof updateData.pickupAddress === 'string') {
      parsedData.pickupAddress = JSON.parse(updateData.pickupAddress);
    }
    if (typeof updateData.bankDetails === 'string') {
      parsedData.bankDetails = JSON.parse(updateData.bankDetails);
    }
    if (typeof updateData.taxDetails === 'string') {
      parsedData.taxDetails = JSON.parse(updateData.taxDetails);
    }

    // Update documents if files were uploaded
    if (Object.keys(documentPaths).length > 0) {
      parsedData.documents = {
        ...vendor.documents,
        ...documentPaths,
      };
    }

    const updatedVendor = await this.vendorModel.findByIdAndUpdate(
      vendor._id,
      parsedData,
      { new: true },
    );

    if (!updatedVendor) {
      throw new NotFoundException('Failed to update vendor profile');
    }

    return updatedVendor.populate('user', 'name email');
  }

  async searchVendors(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const vendors = await this.vendorModel
      .find({
        $and: [
          { status: VendorStatus.APPROVED },
          { isActive: true },
          {
            $or: [
              { shopName: { $regex: query, $options: 'i' } },
              { businessName: { $regex: query, $options: 'i' } },
              { specialties: { $in: [new RegExp(query, 'i')] } },
            ],
          },
        ],
      })
      .populate('user', 'name email')
      .sort({ averageRating: -1, totalReviews: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.vendorModel.countDocuments({
      $and: [
        { status: VendorStatus.APPROVED },
        { isActive: true },
        {
          $or: [
            { shopName: { $regex: query, $options: 'i' } },
            { businessName: { $regex: query, $options: 'i' } },
            { specialties: { $in: [new RegExp(query, 'i')] } },
          ],
        },
      ],
    });

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}