import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  RawBody,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Body() body: { amount: number; currency?: string; orderId: string },
    @Request() req,
  ) {
    return this.paymentsService.createPaymentIntent({
      ...body,
      customerId: req.user.stripeCustomerId, // If you store Stripe customer ID
    });
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(@Body() body: { paymentIntentId: string }) {
    return this.paymentsService.confirmPayment(body.paymentIntentId);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(
    @Body() body: { paymentIntentId: string; amount?: number },
  ) {
    return this.paymentsService.refundPayment(body.paymentIntentId, body.amount);
  }

  @Post('create-customer')
  @UseGuards(JwtAuthGuard)
  async createCustomer(@Request() req) {
    return this.paymentsService.createCustomer(req.user.email, req.user.name);
  }

  @Post('paypal/create-order')
  @UseGuards(JwtAuthGuard)
  async createPayPalOrder(
    @Body() body: { amount: number; currency?: string; orderId: string },
  ) {
    return this.paymentsService.createPayPalOrder(body);
  }

  @Post('paypal/capture-order')
  @UseGuards(JwtAuthGuard)
  async capturePayPalOrder(@Body() body: { orderId: string }) {
    return this.paymentsService.capturePayPalOrder(body.orderId);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer,
  ) {
    return this.paymentsService.handleWebhook(signature, payload);
  }
}