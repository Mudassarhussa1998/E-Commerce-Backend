import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
    private readonly togetherApiKey: string;
    private readonly apiUrl = 'https://api.together.xyz/v1/chat/completions';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly productsService: ProductsService,
    ) {
        this.togetherApiKey = this.configService.get<string>('TOGETHER_API_KEY') || '';
    }

    async chat(userMessage: string) {
        // 1. Fetch simplified product catalog
        const productsResult = await this.productsService.findAll({});
        const productContext = productsResult.products.map(p =>
            `- ${p.title} (${p.category}): Rp ${p.price.toLocaleString()} - ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}`
        ).join('\n');

        // 2. Construct System Prompt
        const systemPrompt = `You are a helpful and friendly AI assistant for a furniture store called "Furniro".
    
    Here is our current product catalog:
    ${productContext}
    
    Your goal is to help customers find products, answer questions about prices and availability, and provide recommendations.
    - Be concise and polite.
    - If a user asks about a product not in the list, say you don't have it.
    - Prices are in Indonesian Rupiah (Rp).
    - Do not invent products.
    `;

        // 3. Call Together AI API
        try {
            const payload = {
                model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 512,
                temperature: 0.7,
                top_p: 0.7,
                top_k: 50,
                repetition_penalty: 1,
                stop: ['<|eot_id|>']
            };

            console.log('Sending request to Together AI...');
            const { data } = await firstValueFrom(
                this.httpService.post(this.apiUrl, payload, {
                    headers: {
                        'Authorization': `Bearer ${this.togetherApiKey}`,
                        'Content-Type': 'application/json'
                    }
                })
            );
            console.log('Received response from Together AI');

            return { reply: data.choices[0].message.content };
        } catch (error) {
            console.error('AI API Error Details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                apiKeyPresent: !!this.togetherApiKey
            });
            return { reply: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later." };
        }
    }
    async searchByImage(file: Express.Multer.File) {
        try {
            console.log('Processing image search...');

            // 1. Convert image to Base64
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

            // 2. Analyze Image with Vision Model
            const visionPayload = {
                model: 'meta-llama/Llama-Vision-Free',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Describe this furniture item in detail. Focus on type (chair, sofa, etc.), color, material, and style. Be concise.' },
                            { type: 'image_url', image_url: { url: base64Image } }
                        ]
                    }
                ],
                max_tokens: 300,
            };

            console.log('Sending image to Vision model...');
            const visionResponse = await firstValueFrom(
                this.httpService.post(this.apiUrl, visionPayload, {
                    headers: {
                        'Authorization': `Bearer ${this.togetherApiKey}`,
                        'Content-Type': 'application/json'
                    }
                })
            );

            const description = visionResponse.data.choices[0].message.content;
            console.log('Image Description:', description);

            // 3. Find Matching Product using Text Model
            const productsResult = await this.productsService.findAll({});
            const productContext = productsResult.products.map(p =>
                `- ID: ${(p as any)._id}, Name: ${p.title}, Category: ${p.category}, Price: ${p.price}, Description: ${p.description}`
            ).join('\n');

            const matchPrompt = `
            I have a customer looking for a piece of furniture described as: "${description}".
            
            Here is our catalog:
            ${productContext}
            
            Find the single best matching product from our catalog.
            Return ONLY the ID of the matching product. If no good match is found, return "null".
            Do not explain. Just return the ID or "null".
            `;

            const matchPayload = {
                model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
                messages: [
                    { role: 'user', content: matchPrompt }
                ],
                max_tokens: 50,
                temperature: 0.1 // Low temperature for precise matching
            };

            console.log('Finding matching product...');
            const matchResponse = await firstValueFrom(
                this.httpService.post(this.apiUrl, matchPayload, {
                    headers: {
                        'Authorization': `Bearer ${this.togetherApiKey}`,
                        'Content-Type': 'application/json'
                    }
                })
            );

            const matchId = matchResponse.data.choices[0].message.content.trim();
            console.log('Matched Product ID:', matchId);

            if (matchId && matchId !== 'null') {
                // Clean up ID if it contains extra quotes or text (basic cleanup)
                const cleanId = matchId.replace(/['"]/g, '').trim();

                // Verify it's a valid ID format (optional, but good safety)
                if (cleanId.match(/^[0-9a-fA-F]{24}$/)) {
                    const product = await this.productsService.findOne(cleanId);
                    return {
                        reply: `I found a match! Based on your image, this looks like the **${product.title}**.`,
                        product: product
                    };
                }
            }

            return {
                reply: `That looks like a nice ${description.split(' ')[0] || 'item'}, but I couldn't find an exact match in our catalog.`,
                product: null
            };

        } catch (error) {
            console.error('Visual Search Error:', error.response?.data || error.message);
            return {
                reply: "I'm having trouble analyzing that image right now. Please try again.",
                product: null
            };
        }
    }
}
