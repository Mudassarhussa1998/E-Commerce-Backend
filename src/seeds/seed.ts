import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from '../products/schemas/product.schema';
import { User } from '../auth/schemas/user.schema';
import * as bcrypt from 'bcrypt';

const initialProducts = [
    // Chairs
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
        images: ['/images/shelf.png', '/images/shelf.png', '/images/shelf.png'],
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
        images: ['/images/bedroom.png', '/images/bedroom.png'],
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
        images: ['/images/laptop.png', '/images/laptop.png'],
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
        images: ['/images/dining_room.png', '/images/dining_room.png'],
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
        images: ['/images/living_room.png', '/images/living_room.png'],
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
        images: ['/images/bed_detail.png', '/images/bed_detail.png'],
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
        images: ['/images/shelf.png', '/images/shelf.png'],
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
        images: ['/images/bedroom.png', '/images/bedroom.png'],
        isNew: true,
        isFeatured: false,
    },
    // New Products
    {
        title: 'Asgaard',
        subtitle: 'Beautiful sofa',
        description: 'Asgaard sofa offers a comfortable seating experience with a modern aesthetic.',
        price: 25000000,
        category: 'Sofas',
        stock: 5,
        image: '/images/sofa_yellow.png',
        images: ['/images/sofa_yellow.png', '/images/sofa_yellow.png'],
        isNew: true,
        isFeatured: true,
    },
    {
        title: 'Maya',
        subtitle: 'Sofa three seater',
        description: 'Maya sofa is a perfect blend of comfort and style for your living room.',
        price: 11500000,
        category: 'Sofas',
        stock: 12,
        image: '/images/sofa_white.png',
        images: ['/images/sofa_white.png', '/images/sofa_white.png'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Outdoor Sofa Set',
        subtitle: 'Garden furniture',
        description: 'Durable outdoor sofa set for your garden or patio.',
        price: 22400000,
        category: 'Sofas',
        stock: 8,
        image: '/images/outdoor_sofa.png',
        images: ['/images/outdoor_sofa.png', '/images/outdoor_sofa.png'],
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Leviosa Table',
        subtitle: 'Modern dining table',
        description: 'A sleek dining table that fits perfectly in modern homes.',
        price: 8500000,
        category: 'Tables',
        stock: 20,
        image: '/images/dining_table.png',
        images: ['/images/dining_table.png', '/images/dining_table.png'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Granite Dining Table',
        subtitle: 'Luxury dining',
        description: 'High-quality granite dining table for a luxurious dining experience.',
        price: 15000000,
        category: 'Tables',
        stock: 5,
        image: '/images/granite_table.png',
        images: ['/images/granite_table.png', '/images/granite_table.png'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Bedside Table',
        subtitle: 'Wooden table',
        description: 'Compact bedside table with storage.',
        price: 1200000,
        category: 'Tables',
        stock: 45,
        image: '/images/bedside_table.png',
        images: ['/images/bedside_table.png', '/images/bedside_table.png'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Luxury Bed',
        subtitle: 'King size bed',
        description: 'Experience royal comfort with this luxury king size bed.',
        price: 18000000,
        category: 'Beds',
        stock: 6,
        image: '/images/luxury_bed.png',
        images: ['/images/luxury_bed.png', '/images/luxury_bed.png'],
        isNew: true,
        isFeatured: true,
    },
    {
        title: 'Single Bed',
        subtitle: 'Comfortable single bed',
        description: 'Perfect for guest rooms or kids rooms.',
        price: 4500000,
        category: 'Beds',
        stock: 25,
        image: '/images/single_bed.png',
        images: ['/images/single_bed.png', '/images/single_bed.png'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Wooden Chair',
        subtitle: 'Classic design',
        description: 'A classic wooden chair that never goes out of style.',
        price: 800000,
        category: 'Chairs',
        stock: 60,
        image: '/images/wooden_chair.png',
        images: ['/images/wooden_chair.png', '/images/wooden_chair.png'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Office Chair',
        subtitle: 'Ergonomic chair',
        description: 'Work in comfort with this ergonomic office chair.',
        price: 2500000,
        category: 'Chairs',
        stock: 35,
        image: '/images/office_chair.png',
        images: ['/images/office_chair.png', '/images/office_chair.png'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Bookshelf',
        subtitle: 'Wooden bookshelf',
        description: 'Spacious bookshelf for your collection.',
        price: 3500000,
        category: 'Storage',
        stock: 15,
        image: '/images/bookshelf.png',
        images: ['/images/bookshelf.png', '/images/bookshelf.png'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Wardrobe',
        subtitle: 'Large wardrobe',
        description: 'Keep your clothes organized with this large wardrobe.',
        price: 9000000,
        category: 'Storage',
        stock: 10,
        image: '/images/wardrobe.png',
        images: ['/images/wardrobe.png', '/images/wardrobe.png'],
        isNew: true,
        isFeatured: false,
    }
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
