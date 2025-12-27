import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private smtpTransporter: nodemailer.Transporter | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Default to a professional generic sender if not specified, but usually EMAIL_FROM should be set
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || '"Funiro Support" <support@funiro.com>';

    // DEBUG: Log what we see (security masked)
    this.logger.log(`🔍 Debug Env Vars: Host=${smtpHost ? 'OK' : 'MISSING'}, User=${smtpUser ? 'OK' : 'MISSING'}, Pass=${smtpPass ? 'SET' : 'MISSING'}`);

    if (smtpHost && smtpUser && smtpPass) {
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT') || 587,
        secure: this.configService.get<string>('SMTP_SECURE') === 'true', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('✅ SMTP email service initialized');
    } else {
      this.logger.warn('⚠️ SMTP not configured. Emails will NOT be sent (logs only). Check SMTP_HOST, SMTP_USER, SMTP_PASS.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (this.smtpTransporter) {
      try {
        const info = await this.smtpTransporter.sendMail({
          from: this.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        this.logger.log(`📧 Email sent to: ${options.to} (Message ID: ${info.messageId})`);
        return true;
      } catch (error) {
        this.logger.error(`❌ Failed to send email to ${options.to}:`, error);
        return false;
      }
    }

    // Fallback: Just log if no transporter (Dev mode or missing config)
    this.logger.warn(`⚠️ Email skipped (No SMTP Config). To: ${options.to}, Subject: ${options.subject}`);
    return false; // Return false to indicate email was not sent
  }

  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Email Verification</h1>
        <p>Your verification code is:</p>
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
          <h2 style="color: #B88E2F; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h2>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <p>Best regards,<br>The StyleHub Team</p>
      </div>
    `;

    // Always log OTP for development/testing
    this.logger.log(`🔐 OTP for ${email}: ${otp}`);

    const result = await this.sendEmail({
      to: email,
      subject: 'Your StyleHub Verification Code',
      html,
    });

    if (result) {
      this.logger.log(`✅ Email verification code sent to: ${email}`);
    }

    return true; // Return true even if email fails so OTP flow continues
  }


  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Funiro!</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for joining Funiro! We're excited to have you as part of our furniture community.</p>
        <p>Start exploring our amazing collection of furniture and home decor items.</p>
        <div style="margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}/shop" 
             style="background-color: #B88E2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Start Shopping
          </a>
        </div>
        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to Funiro - Your Furniture Journey Begins!',
      html,
    });
  }

  async sendOrderConfirmation(
    userEmail: string,
    userName: string,
    orderNumber: string,
    orderTotal: number,
    orderItems: any[],
  ): Promise<boolean> {
    const itemsHtml = orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString()}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for your order! We've received your order and it's being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0;">Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Total Amount:</strong> ${orderTotal.toLocaleString()}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p>We'll send you another email when your order ships.</p>
        
        <div style="margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}/profile/orders" 
             style="background-color: #B88E2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Track Your Order
          </a>
        </div>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Order Confirmation - ${orderNumber}`,
      html,
    });
  }

  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password for your Funiro account.</p>
        <p>Click the button below to reset your password:</p>
        
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #B88E2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </div>

        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour for security reasons.</p>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Reset Your Funiro Password',
      html,
    });
  }

  async sendOrderStatusUpdate(
    userEmail: string,
    userName: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string,
  ): Promise<boolean> {
    let statusMessage = '';
    let statusColor = '#B88E2F';

    switch (status) {
      case 'processing':
        statusMessage = 'Your order is being processed and will ship soon.';
        statusColor = '#ffc107';
        break;
      case 'shipped':
        statusMessage = 'Great news! Your order has been shipped.';
        statusColor = '#17a2b8';
        break;
      case 'delivered':
        statusMessage = 'Your order has been delivered. We hope you love it!';
        statusColor = '#28a745';
        break;
      case 'cancelled':
        statusMessage = 'Your order has been cancelled.';
        statusColor = '#dc3545';
        break;
      default:
        statusMessage = `Your order status has been updated to: ${status}`;
    }

    const trackingHtml = trackingNumber
      ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Status Update</h1>
        <p>Hi ${userName},</p>
        
        <div style="background-color: ${statusColor}; color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; text-transform: uppercase;">${status}</h2>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          ${trackingHtml}
          <p>${statusMessage}</p>
        </div>

        <div style="margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}/profile/orders" 
             style="background-color: #B88E2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Order Details
          </a>
        </div>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Order Update - ${orderNumber} is ${status}`,
      html,
    });
  }

  async sendNewsletterEmail(
    userEmail: string,
    subject: string,
    content: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #B88E2F; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Funiro Newsletter</h1>
        </div>
        
        <div style="padding: 20px;">
          ${content}
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; font-size: 12px; color: #6c757d;">
            You're receiving this email because you subscribed to our newsletter.
            <a href="${this.configService.get('FRONTEND_URL')}/unsubscribe" style="color: #B88E2F;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html,
    });
  }


  // Vendor Email Methods
  async sendVendorApplicationNotification(
    vendorEmail: string,
    vendorName: string,
    shopName: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Vendor Application Received</h1>
        <p>Hi ${vendorName},</p>
        <p>Thank you for applying to become a vendor on our platform!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0;">Application Details</h3>
          <p><strong>Shop Name:</strong> ${shopName}</p>
          <p><strong>Status:</strong> Under Review</p>
        </div>

        <p>Our team will review your application and get back to you within 2-3 business days.</p>
        <p>You will receive an email notification once your application is approved or if we need additional information.</p>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject: 'Vendor Application Received - Under Review',
      html,
    });
  }

  async sendVendorApprovalEmail(
    vendorEmail: string,
    vendorName: string,
    shopName: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Congratulations! Your Vendor Application is Approved</h1>
        <p>Hi ${vendorName},</p>
        <p>Great news! Your vendor application for "${shopName}" has been approved.</p>
        
        <div style="background-color: #d4edda; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
          <h3 style="margin: 0 0 10px 0; color: #155724;">Welcome to Funiro Marketplace!</h3>
          <p style="margin: 0; color: #155724;">You can now start adding products and managing your shop.</p>
        </div>

        <div style="margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}/vendor/dashboard" 
             style="background-color: #B88E2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Access Vendor Dashboard
          </a>
        </div>

        <p>Next steps:</p>
        <ul>
          <li>Complete your shop profile</li>
          <li>Add your first products</li>
          <li>Set up your payment information</li>
        </ul>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject: 'Vendor Application Approved - Welcome to Funiro!',
      html,
    });
  }

  async sendVendorRejectionEmail(
    vendorEmail: string,
    vendorName: string,
    shopName: string,
    reason: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545;">Vendor Application Update</h1>
        <p>Hi ${vendorName},</p>
        <p>Thank you for your interest in becoming a vendor on our platform.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h3 style="margin: 0 0 10px 0; color: #721c24;">Application Status: Not Approved</h3>
          <p style="margin: 0; color: #721c24;">Unfortunately, we cannot approve your application at this time.</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0;">Reason:</h4>
          <p style="margin: 0;">${reason}</p>
        </div>

        <p>You're welcome to reapply once you've addressed the concerns mentioned above.</p>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject: 'Vendor Application Update',
      html,
    });
  }

  async sendVendorSuspensionEmail(
    vendorEmail: string,
    vendorName: string,
    shopName: string,
    reason: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545;">Account Suspension Notice</h1>
        <p>Hi ${vendorName},</p>
        <p>We regret to inform you that your vendor account for "${shopName}" has been suspended.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h3 style="margin: 0 0 10px 0; color: #721c24;">Account Suspended</h3>
          <p style="margin: 0; color: #721c24;">Your shop is temporarily unavailable to customers.</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0;">Reason for Suspension:</h4>
          <p style="margin: 0;">${reason}</p>
        </div>

        <p>To appeal this decision or discuss reinstatement, please contact our support team.</p>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject: 'Account Suspension Notice',
      html,
    });
  }

  async sendVendorUnsuspensionEmail(
    vendorEmail: string,
    vendorName: string,
    shopName: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Account Reinstated</h1>
        <p>Hi ${vendorName},</p>
        <p>Great news! Your vendor account for "${shopName}" has been reinstated and is now active.</p>
        
        <div style="background-color: #d4edda; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
          <h3 style="margin: 0 0 10px 0; color: #155724;">Account Active</h3>
          <p style="margin: 0; color: #155724;">Your shop is now available to customers again.</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0;">What's Next:</h4>
          <ul style="margin: 10px 0;">
            <li>Your products are now visible to customers</li>
            <li>You can receive new orders</li>
            <li>All vendor features are restored</li>
          </ul>
        </div>

        <p>Thank you for your patience. We look forward to your continued success on our platform.</p>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: vendorEmail,
      subject: 'Account Reinstated - Welcome Back!',
      html,
    });
  }

  // Report Email Methods
  async sendReportAssignmentNotification(
    adminEmail: string,
    adminName: string,
    reportSubject: string,
    reportId: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">New Report Assigned</h1>
        <p>Hi ${adminName},</p>
        <p>A new report has been assigned to you for review.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0;">Report Details</h3>
          <p><strong>Subject:</strong> ${reportSubject}</p>
          <p><strong>Report ID:</strong> ${reportId}</p>
        </div>

        <div style="margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}/admin/reports/${reportId}" 
             style="background-color: #B88E2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Review Report
          </a>
        </div>

        <p>Best regards,<br>The Funiro System</p>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: 'New Report Assigned for Review',
      html,
    });
  }

  async sendReportResolutionNotification(
    userEmail: string,
    userName: string,
    reportSubject: string,
    resolution: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #28a745;">Report Resolved</h1>
        <p>Hi ${userName},</p>
        <p>Your report has been reviewed and resolved by our team.</p>
        
        <div style="background-color: #d4edda; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
          <h3 style="margin: 0 0 10px 0; color: #155724;">Report: ${reportSubject}</h3>
          <p style="margin: 0; color: #155724;">Status: Resolved</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0;">Resolution:</h4>
          <p style="margin: 0;">${resolution}</p>
        </div>

        <p>Thank you for bringing this to our attention. If you have any further concerns, please don't hesitate to contact us.</p>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Your Report Has Been Resolved',
      html,
    });
  }

  async sendReportRejectionNotification(
    userEmail: string,
    userName: string,
    reportSubject: string,
    reason: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc3545;">Report Update</h1>
        <p>Hi ${userName},</p>
        <p>Your report has been reviewed by our team.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h3 style="margin: 0 0 10px 0; color: #721c24;">Report: ${reportSubject}</h3>
          <p style="margin: 0; color: #721c24;">Status: Not Actionable</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0;">Reason:</h4>
          <p style="margin: 0;">${reason}</p>
        </div>

        <p>If you believe this decision was made in error, you may submit a new report with additional information.</p>

        <p>Best regards,<br>The Funiro Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Report Update',
      html,
    });
  }

  async sendNewReportNotification(
    adminEmail: string,
    adminName: string,
    reportSubject: string,
    reportType: string,
    reportId: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ffc107;">New Report Submitted</h1>
        <p>Hi ${adminName},</p>
        <p>A new report has been submitted and requires admin attention.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h3 style="margin: 0 0 10px 0; color: #856404;">Report Details</h3>
          <p style="margin: 5px 0; color: #856404;"><strong>Type:</strong> ${reportType}</p>
          <p style="margin: 5px 0; color: #856404;"><strong>Subject:</strong> ${reportSubject}</p>
          <p style="margin: 5px 0; color: #856404;"><strong>ID:</strong> ${reportId}</p>
        </div>

        <div style="margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}/admin/reports/${reportId}" 
             style="background-color: #B88E2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Review Report
          </a>
        </div>

        <p>Best regards,<br>The Funiro System</p>
      </div>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: 'New Report Requires Review',
      html,
    });
  }
}
