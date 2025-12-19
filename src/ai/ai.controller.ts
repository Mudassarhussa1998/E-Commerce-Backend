import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Body('message') message: string) {
        return this.aiService.chat(message);
    }

    @Post('image-search')
    @UseInterceptors(FileInterceptor('image'))
    async imageSearch(@UploadedFile() file: Express.Multer.File) {
        return this.aiService.searchByImage(file);
    }
}
