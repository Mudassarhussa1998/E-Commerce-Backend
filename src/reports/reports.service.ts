import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument, ReportStatus, ReportType } from './schemas/report.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateReportDto, UpdateReportDto, AddCommentDto } from './dto/create-report.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private emailService: EmailService,
  ) {}

  async createReport(userId: string, createReportDto: CreateReportDto): Promise<Report> {
    const report = new this.reportModel({
      reportedBy: userId,
      ...createReportDto,
      status: ReportStatus.PENDING,
    });

    const savedReport = await report.save();

    // Notify admins about new report
    await this.notifyAdminsAboutNewReport(savedReport);

    return savedReport.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'reportedUser', select: 'name email' },
      { path: 'reportedVendor', select: 'shopName businessName' },
      { path: 'reportedProduct', select: 'title' },
    ]);
  }

  async getAllReports(
    page = 1,
    limit = 10,
    status?: ReportStatus,
    type?: ReportType,
    priority?: string,
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const reports = await this.reportModel
      .find(query)
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reportedVendor', 'shopName businessName')
      .populate('reportedProduct', 'title')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.reportModel.countDocuments(query);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getReportById(reportId: string): Promise<Report> {
    const report = await this.reportModel
      .findById(reportId)
      .populate('reportedBy', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reportedVendor', 'shopName businessName')
      .populate('reportedProduct', 'title')
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('comments.author', 'name email');

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async getUserReports(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const reports = await this.reportModel
      .find({ reportedBy: userId })
      .populate('reportedUser', 'name email')
      .populate('reportedVendor', 'shopName businessName')
      .populate('reportedProduct', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.reportModel.countDocuments({ reportedBy: userId });

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateReport(
    reportId: string,
    updateReportDto: UpdateReportDto,
    adminId: string,
  ): Promise<Report> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    Object.assign(report, updateReportDto);

    if (updateReportDto.assignedTo) {
      report.assignedTo = new Types.ObjectId(updateReportDto.assignedTo);
    }

    await report.save();

    return this.getReportById(reportId);
  }

  async assignReport(reportId: string, adminId: string, assignToId: string): Promise<Report> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.assignedTo = new Types.ObjectId(assignToId);
    report.status = ReportStatus.UNDER_REVIEW;

    await report.save();

    // Notify assigned admin
    const assignedAdmin = await this.userModel.findById(assignToId);
    if (assignedAdmin) {
      await this.emailService.sendReportAssignmentNotification(
        assignedAdmin.email,
        assignedAdmin.name,
        report.subject,
        reportId,
      );
    }

    return this.getReportById(reportId);
  }

  async resolveReport(
    reportId: string,
    resolution: string,
    adminId: string,
  ): Promise<Report> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = ReportStatus.RESOLVED;
    report.resolution = resolution;
    report.resolvedBy = new Types.ObjectId(adminId);
    report.resolvedAt = new Date();

    await report.save();

    // Notify the reporter
    const reporter = await this.userModel.findById(report.reportedBy);
    if (reporter) {
      await this.emailService.sendReportResolutionNotification(
        reporter.email,
        reporter.name,
        report.subject,
        resolution,
      );
    }

    return this.getReportById(reportId);
  }

  async rejectReport(reportId: string, reason: string, adminId: string): Promise<Report> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = ReportStatus.REJECTED;
    report.adminNotes = reason;
    report.resolvedBy = new Types.ObjectId(adminId);
    report.resolvedAt = new Date();

    await report.save();

    // Notify the reporter
    const reporter = await this.userModel.findById(report.reportedBy);
    if (reporter) {
      await this.emailService.sendReportRejectionNotification(
        reporter.email,
        reporter.name,
        report.subject,
        reason,
      );
    }

    return this.getReportById(reportId);
  }

  async addComment(
    reportId: string,
    addCommentDto: AddCommentDto,
    userId: string,
  ): Promise<Report> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.comments.push({
      message: addCommentDto.message,
      author: new Types.ObjectId(userId),
      createdAt: new Date(),
      isInternal: addCommentDto.isInternal || false,
    });

    await report.save();

    return this.getReportById(reportId);
  }

  async upvoteReport(reportId: string, userId: string): Promise<Report> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const hasUpvoted = report.upvotedBy.some(id => id.equals(userObjectId));

    if (hasUpvoted) {
      // Remove upvote
      report.upvotedBy = report.upvotedBy.filter(id => !id.equals(userObjectId));
      report.upvotes = Math.max(0, report.upvotes - 1);
    } else {
      // Add upvote
      report.upvotedBy.push(userObjectId);
      report.upvotes++;
    }

    await report.save();

    return this.getReportById(reportId);
  }

  async deleteReport(reportId: string, userId: string, isAdmin = false): Promise<void> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Only allow user to delete their own report or admin to delete any
    if (!isAdmin && report.reportedBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own reports');
    }

    await this.reportModel.findByIdAndDelete(reportId);
  }

  async getReportStats() {
    const totalReports = await this.reportModel.countDocuments();
    const pendingReports = await this.reportModel.countDocuments({
      status: ReportStatus.PENDING,
    });
    const resolvedReports = await this.reportModel.countDocuments({
      status: ReportStatus.RESOLVED,
    });
    const underReviewReports = await this.reportModel.countDocuments({
      status: ReportStatus.UNDER_REVIEW,
    });

    const reportsByType = await this.reportModel.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const reportsByPriority = await this.reportModel.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      underReviewReports,
      reportsByType,
      reportsByPriority,
    };
  }

  private async notifyAdminsAboutNewReport(report: Report) {
    const admins = await this.userModel.find({ role: 'admin' });
    
    for (const admin of admins) {
      await this.emailService.sendNewReportNotification(
        admin.email,
        admin.name,
        report.subject,
        report.type,
        (report as any)._id.toString(),
      );
    }
  }
}