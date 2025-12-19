import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CreatePaymentIntentDto {
  amount: number;
  currency?: string;
  orderId: string;
  customerId?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey && stripeKey.startsWith('sk_')) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    }
  }

  async createPaymentIntent(data: CreatePaymentIntentDto): Promise<PaymentIntent> {
    try {
      // Use real Stripe if configured
      if (this.stripe) {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(data.amount * 100), // Stripe uses cents
          currency: data.currency || 'usd',
          metadata: {
            orderId: data.orderId,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        this.logger.log(`Created Stripe payment intent: ${paymentIntent.id} for order: ${data.orderId}`);

        return {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret || '',
          amount: data.amount,
          currency: data.currency || 'usd',
          status: paymentIntent.status,
        };
      }

      // Dummy/Mock payment for development
      const mockPaymentIntent: PaymentIntent = {
        id: `pi_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clientSecret: `pi_demo_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        amount: data.amount,
        currency: data.currency || 'usd',
        status: 'requires_payment_method',
      };

      this.logger.log(`[DEMO] Created mock payment intent: ${mockPaymentIntent.id} for order: ${data.orderId}`);
      
      return mockPaymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<{ status: string; paymentMethod?: any }> {
    try {
      if (this.stripe && !paymentIntentId.startsWith('pi_demo_')) {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        this.logger.log(`Payment status retrieved: ${paymentIntentId} - ${paymentIntent.status}`);
        
        return {
          status: paymentIntent.status,
          paymentMethod: paymentIntent.payment_method,
        };
      }

      // Demo mode - simulate successful payment
      const mockResult = {
        status: 'succeeded',
        paymentMethod: {
          id: `pm_demo_${Math.random().toString(36).substr(2, 9)}`,
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
          },
        },
      };

      this.logger.log(`[DEMO] Payment confirmed: ${paymentIntentId}`);
      
      return mockResult;
    } catch (error) {
      this.logger.error('Failed to confirm payment:', error);
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<{ id: string; status: string }> {
    try {
      if (this.stripe && !paymentIntentId.startsWith('pi_demo_')) {
        const refund = await this.stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        });

        this.logger.log(`Refund created: ${refund.id} for payment: ${paymentIntentId}`);
        
        return {
          id: refund.id,
          status: refund.status || 'succeeded',
        };
      }

      // Demo mode
      const mockRefund = {
        id: `re_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
      };

      this.logger.log(`[DEMO] Refund created: ${mockRefund.id} for payment: ${paymentIntentId}`);
      
      return mockRefund;
    } catch (error) {
      this.logger.error('Failed to create refund:', error);
      throw new BadRequestException('Failed to create refund');
    }
  }

  async createCustomer(email: string, name: string): Promise<{ id: string }> {
    try {
      if (this.stripe) {
        const customer = await this.stripe.customers.create({
          email,
          name,
        });

        this.logger.log(`Created Stripe customer: ${customer.id} for ${email}`);
        
        return { id: customer.id };
      }

      // Demo mode
      const mockCustomer = {
        id: `cus_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      this.logger.log(`[DEMO] Created customer: ${mockCustomer.id} for ${email}`);
      
      return mockCustomer;
    } catch (error) {
      this.logger.error('Failed to create customer:', error);
      throw new BadRequestException('Failed to create customer');
    }
  }

  async handleWebhook(signature: string, payload: any): Promise<void> {
    try {
      if (this.stripe) {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (webhookSecret) {
          const event = this.stripe.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
          );

          switch (event.type) {
            case 'payment_intent.succeeded':
              this.logger.log(`Payment succeeded: ${(event.data.object as any).id}`);
              break;
            case 'payment_intent.payment_failed':
              this.logger.log(`Payment failed: ${(event.data.object as any).id}`);
              break;
            default:
              this.logger.log(`Unhandled event type: ${event.type}`);
          }
        }
      }

      this.logger.log('Webhook processed successfully');
    } catch (error) {
      this.logger.error('Webhook processing failed:', error);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  // PayPal integration methods (mock implementation)
  async createPayPalOrder(data: CreatePaymentIntentDto): Promise<{ id: string; approvalUrl: string }> {
    try {
      // In a real implementation, use PayPal SDK
      const mockOrder = {
        id: `PAYPAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=MOCK_TOKEN_${Date.now()}`,
      };

      this.logger.log(`Created PayPal order: ${mockOrder.id}`);
      
      return mockOrder;
    } catch (error) {
      this.logger.error('Failed to create PayPal order:', error);
      throw new BadRequestException('Failed to create PayPal order');
    }
  }

  async capturePayPalOrder(orderId: string): Promise<{ status: string; transactionId: string }> {
    try {
      // In a real implementation, use PayPal SDK to capture the order
      const mockCapture = {
        status: 'COMPLETED',
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      this.logger.log(`Captured PayPal order: ${orderId}`);
      
      return mockCapture;
    } catch (error) {
      this.logger.error('Failed to capture PayPal order:', error);
      throw new BadRequestException('Failed to capture PayPal order');
    }
  }
}