import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // For development, we'll just log the email
      // In production, integrate with services like SendGrid, AWS SES, or Nodemailer
      this.logger.log(`📧 Email would be sent to: ${options.to}`);
      this.logger.log(`📧 Subject: ${options.subject}`);
      this.logger.log(`📧 Content: ${options.html}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
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
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString()}</td>
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
          <p><strong>Total Amount:</strong> $${orderTotal.toLocaleString()}</p>
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
}