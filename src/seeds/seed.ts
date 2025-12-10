import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from '../products/schemas/product.schema';
import { User } from '../auth/schemas/user.schema';
import * as bcrypt from 'bcrypt';

const initialProducts = [
    {
        title: 'Syltherine',
        subtitle: 'Stylish cafe chair',
        description: 'Syltherine is a stylish cafe chair that adds a touch of elegance to any room.',
        price: 2500000,
        originalPrice: 3500000,
        discount: 30,
        category: 'Chairs',
        stock: 25,
        image: '/images/shelf.png',
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Leviosa',
        subtitle: 'Stylish cafe chair',
        description: 'Leviosa is a modern chair with a unique design, perfect for contemporary spaces.',
        price: 2500000,
        category: 'Chairs',
        stock: 30,
        image: '/images/bedroom.png',
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Lolito',
        subtitle: 'Luxury big sofa',
        description: 'Lolito is a luxury big sofa that provides ultimate comfort and style.',
        price: 7000000,
        originalPrice: 14000000,
        discount: 50,
        category: 'Sofas',
        stock: 10,
        image: '/images/laptop.png',
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Respira',
        subtitle: 'Outdoor bar table',
        description: 'Respira is a durable outdoor bar table and stool set, ideal for your patio.',
        price: 500000,
        category: 'Tables',
        stock: 15,
        image: '/images/dining_room.png',
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Grifo',
        subtitle: 'Night lamp',
        description: 'Grifo is a beautiful night lamp with warm lighting.',
        price: 1500000,
        category: 'Storage',
        stock: 50,
        image: '/images/living_room.png',
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Muggo',
        subtitle: 'Small mug',
        description: 'Muggo is a small decorative mug.',
        price: 150000,
        category: 'Storage',
        stock: 100,
        image: '/images/bed_detail.png',
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Pingky',
        subtitle: 'Cute bed set',
        description: 'Pingky is a cute bed set with soft fabrics.',
        price: 7000000,
        originalPrice: 14000000,
        discount: 50,
        category: 'Beds',
        stock: 8,
        image: '/images/shelf.png',
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Potty',
        subtitle: 'Minimalist flower pot',
        description: 'Potty is a minimalist flower pot for your plants.',
        price: 500000,
        category: 'Storage',
        stock: 40,
        image: '/images/bedroom.png',
        isNew: true,
        isFeatured: false,
    },
];

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const productModel = app.get<Model<Product>>(getModelToken(Product.name));
    const userModel = app.get<Model<User>>(getModelToken(User.name));

    try {
        // Clear existing data
        await productModel.deleteMany({});
        await userModel.deleteMany({});

        console.log('✅ Cleared existing data');

        // Seed products
        await productModel.insertMany(initialProducts);
        console.log(`✅ Seeded ${initialProducts.length} products`);

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await userModel.create({
            name: 'Admin User',
            email: 'admin@ecommerce.com',
            password: hashedPassword,
            role: 'admin',
        });
        console.log('✅ Created admin user (admin@ecommerce.com / admin123)');

        // Create test user
        const testPassword = await bcrypt.hash('user123', 10);
        await userModel.create({
            name: 'Test User',
            email: 'user@ecommerce.com',
            password: testPassword,
            role: 'user',
        });
        console.log('✅ Created test user (user@ecommerce.com / user123)');

        console.log('\n🎉 Database seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await app.close();
    }
}

seed();
