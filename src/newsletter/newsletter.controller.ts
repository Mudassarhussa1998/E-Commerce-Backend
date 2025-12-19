import { Controller, Post, Get, Body, UseGuards, Delete, Param } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('newsletter')
export class NewsletterController {
    constructor(private readonly newsletterService: NewsletterService) { }

    @Post('subscribe')
    async subscribe(@Body('email') email: string) {
        return this.newsletterService.subscribe(email);
    }

    @Delete('unsubscribe/:email')
    async unsubscribe(@Param('email') email: string) {
        return this.newsletterService.unsubscribe(email);
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Get('subscribers')
    async findAll() {
        return this.newsletterService.findAll();
    }

    @UseGuards(JwtAuthGuard, AdminGuard)
    @Post('send')
    async send(@Body() body: { subject: string; message: string }) {
        return this.newsletterService.sendToAll(body.subject, body.message);
    }
}
