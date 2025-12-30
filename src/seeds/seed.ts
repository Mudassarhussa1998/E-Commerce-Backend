import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from '../products/schemas/product.schema';
import { User } from '../auth/schemas/user.schema';
import * as bcrypt from 'bcrypt';

const initialProducts = [
    // ============ SOFAS ============
    {
        title: 'Syltherine Sofa',
        subtitle: 'Modern L-shaped sofa',
        description: 'Syltherine is a stylish L-shaped sofa that adds a touch of elegance to any living room. Features premium fabric and sturdy wooden frame.',
        price: 8500000,
        originalPrice: 12000000,
        discount: 30,
        category: 'Sofas',
        stock: 15,
        image: 'https://picsum.photos/800/600?random=1',
        images: ['https://picsum.photos/800/600?random=2'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Lolito',
        subtitle: 'Luxury big sofa',
        description: 'Lolito is a luxury big sofa that provides ultimate comfort and style with velvet upholstery.',
        price: 14000000,
        originalPrice: 20000000,
        discount: 30,
        category: 'Sofas',
        stock: 10,
        image: 'https://picsum.photos/800/600?random=3',
        images: ['https://picsum.photos/800/600?random=4'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Asgaard Sofa',
        subtitle: 'Premium leather sofa',
        description: 'Asgaard sofa offers a comfortable seating experience with genuine leather and modern aesthetic.',
        price: 25000000,
        category: 'Sofas',
        stock: 5,
        image: 'https://picsum.photos/800/600?random=5',
        images: ['https://picsum.photos/800/600?random=6'],
        isNew: true,
        isFeatured: true,
    },
    {
        title: 'Maya Sofa',
        subtitle: 'Three seater comfort',
        description: 'Maya sofa is a perfect blend of comfort and style for your living room with soft cushions.',
        price: 11500000,
        category: 'Sofas',
        stock: 12,
        image: 'https://picsum.photos/800/600?random=7',
        images: ['https://picsum.photos/800/600?random=8'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Outdoor Sofa Set',
        subtitle: 'Garden furniture',
        description: 'Durable outdoor sofa set for your garden or patio. Weather-resistant materials.',
        price: 22400000,
        category: 'Sofas',
        stock: 8,
        image: 'https://picsum.photos/800/600?random=9',
        images: ['https://picsum.photos/800/600?random=10'],
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Velvet Loveseat',
        subtitle: 'Compact two seater',
        description: 'Perfect for small spaces, this velvet loveseat adds elegance to any room.',
        price: 6500000,
        category: 'Sofas',
        stock: 20,
        image: 'https://picsum.photos/800/600?random=11',
        images: ['https://picsum.photos/800/600?random=12'],
        isNew: true,
        isFeatured: false,
    },

    // ============ CHAIRS ============
    {
        title: 'Leviosa Chair',
        subtitle: 'Stylish cafe chair',
        description: 'Leviosa is a modern chair with a unique design, perfect for contemporary spaces.',
        price: 2500000,
        category: 'Chairs',
        stock: 30,
        image: 'https://picsum.photos/800/600?random=13',
        images: ['https://picsum.photos/800/600?random=14'],
        isNew: true,
        isFeatured: true,
    },
    {
        title: 'Wooden Dining Chair',
        subtitle: 'Classic design',
        description: 'A classic wooden chair that never goes out of style. Solid oak construction.',
        price: 1800000,
        category: 'Chairs',
        stock: 60,
        image: 'https://picsum.photos/800/600?random=15',
        images: ['https://picsum.photos/800/600?random=16'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Ergonomic Office Chair',
        subtitle: 'Work in comfort',
        description: 'Work in comfort with this ergonomic office chair featuring lumbar support and adjustable height.',
        price: 3500000,
        category: 'Chairs',
        stock: 35,
        image: 'https://picsum.photos/800/600?random=17',
        images: ['https://picsum.photos/800/600?random=18'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Accent Armchair',
        subtitle: 'Statement piece',
        description: 'Make a statement with this beautiful accent armchair in vibrant colors.',
        price: 4200000,
        category: 'Chairs',
        stock: 25,
        image: 'https://picsum.photos/800/600?random=19',
        images: ['https://picsum.photos/800/600?random=20'],
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Rocking Chair',
        subtitle: 'Relaxation classic',
        description: 'Traditional rocking chair perfect for your porch or living room.',
        price: 2800000,
        category: 'Chairs',
        stock: 18,
        image: 'https://picsum.photos/800/600?random=21',
        images: ['https://picsum.photos/800/600?random=22'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Bar Stool Set',
        subtitle: 'Modern kitchen seating',
        description: 'Set of 2 modern bar stools with adjustable height and footrest.',
        price: 3200000,
        category: 'Chairs',
        stock: 40,
        image: 'https://picsum.photos/800/600?random=23',
        images: ['https://picsum.photos/800/600?random=24'],
        isNew: true,
        isFeatured: false,
    },

    // ============ TABLES ============
    {
        title: 'Respira Dining Table',
        subtitle: 'Family gathering spot',
        description: 'Respira is a beautiful dining table that seats 6, perfect for family dinners.',
        price: 8500000,
        category: 'Tables',
        stock: 15,
        image: 'https://picsum.photos/800/600?random=25',
        images: ['https://picsum.photos/800/600?random=26'],
        isNew: true,
        isFeatured: true,
    },
    {
        title: 'Granite Dining Table',
        subtitle: 'Luxury dining',
        description: 'High-quality granite dining table for a luxurious dining experience.',
        price: 15000000,
        category: 'Tables',
        stock: 5,
        image: 'https://picsum.photos/800/600?random=27',
        images: ['https://picsum.photos/800/600?random=28'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Coffee Table',
        subtitle: 'Living room essential',
        description: 'Modern coffee table with storage shelf. Perfect centerpiece for your living room.',
        price: 2500000,
        category: 'Tables',
        stock: 45,
        image: 'https://picsum.photos/800/600?random=29',
        images: ['https://picsum.photos/800/600?random=30'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Bedside Table',
        subtitle: 'Compact nightstand',
        description: 'Compact bedside table with drawer storage. Solid wood construction.',
        price: 1200000,
        category: 'Tables',
        stock: 50,
        image: 'https://picsum.photos/800/600?random=31',
        images: ['https://picsum.photos/800/600?random=32'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Study Desk',
        subtitle: 'Work from home',
        description: 'Spacious study desk with cable management and drawer storage.',
        price: 4500000,
        category: 'Tables',
        stock: 30,
        image: 'https://picsum.photos/800/600?random=33',
        images: ['https://picsum.photos/800/600?random=34'],
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Console Table',
        subtitle: 'Entryway elegance',
        description: 'Elegant console table perfect for your entryway or hallway.',
        price: 3800000,
        category: 'Tables',
        stock: 22,
        image: 'https://picsum.photos/800/600?random=35',
        images: ['https://picsum.photos/800/600?random=36'],
        isNew: false,
        isFeatured: false,
    },

    // ============ BEDS ============
    {
        title: 'Pingky Bed',
        subtitle: 'Cute bed set',
        description: 'Pingky is a cute bed set with soft fabrics and a charming design.',
        price: 7000000,
        originalPrice: 14000000,
        discount: 50,
        category: 'Beds',
        stock: 8,
        image: 'https://picsum.photos/800/600?random=37',
        images: ['https://picsum.photos/800/600?random=38'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Luxury King Bed',
        subtitle: 'Royal comfort',
        description: 'Experience royal comfort with this luxury king size bed with upholstered headboard.',
        price: 18000000,
        category: 'Beds',
        stock: 6,
        image: 'https://picsum.photos/800/600?random=39',
        images: ['https://picsum.photos/800/600?random=40'],
        isNew: true,
        isFeatured: true,
    },
    {
        title: 'Single Bed Frame',
        subtitle: 'Space saver',
        description: 'Perfect for guest rooms or kids rooms. Sturdy metal frame.',
        price: 4500000,
        category: 'Beds',
        stock: 25,
        image: 'https://picsum.photos/800/600?random=41',
        images: ['https://picsum.photos/800/600?random=42'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Platform Bed',
        subtitle: 'Modern minimalist',
        description: 'Low profile platform bed with clean lines and modern design.',
        price: 9500000,
        category: 'Beds',
        stock: 12,
        image: 'https://picsum.photos/800/600?random=43',
        images: ['https://picsum.photos/800/600?random=44'],
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Bunk Bed',
        subtitle: 'Kids favorite',
        description: 'Fun and functional bunk bed for kids. Includes safety rails.',
        price: 8000000,
        category: 'Beds',
        stock: 15,
        image: 'https://picsum.photos/800/600?random=45',
        images: ['https://picsum.photos/800/600?random=46'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Storage Bed',
        subtitle: 'Smart storage',
        description: 'Queen bed with built-in storage drawers. Maximize your space.',
        price: 12000000,
        category: 'Beds',
        stock: 10,
        image: 'https://picsum.photos/800/600?random=47',
        images: ['https://picsum.photos/800/600?random=48'],
        isNew: true,
        isFeatured: false,
    },

    // ============ STORAGE ============
    {
        title: 'Grifo Bookshelf',
        subtitle: 'Book lovers dream',
        description: 'Spacious bookshelf for your collection. 5 tiers of storage.',
        price: 3500000,
        category: 'Storage',
        stock: 15,
        image: 'https://picsum.photos/800/600?random=49',
        images: ['https://picsum.photos/800/600?random=50'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Wardrobe',
        subtitle: 'Large wardrobe',
        description: 'Keep your clothes organized with this large wardrobe with mirror.',
        price: 9000000,
        category: 'Storage',
        stock: 10,
        image: 'https://picsum.photos/800/600?random=51',
        images: ['https://picsum.photos/800/600?random=52'],
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'TV Stand',
        subtitle: 'Entertainment center',
        description: 'Modern TV stand with cable management and storage compartments.',
        price: 4200000,
        category: 'Storage',
        stock: 28,
        image: 'https://picsum.photos/800/600?random=53',
        images: ['https://picsum.photos/800/600?random=54'],
        isNew: false,
        isFeatured: false,
    },
    {
        title: 'Shoe Cabinet',
        subtitle: 'Organized entryway',
        description: 'Slim shoe cabinet that fits perfectly in your entryway. Holds 20 pairs.',
        price: 2800000,
        category: 'Storage',
        stock: 35,
        image: 'https://picsum.photos/800/600?random=55',
        images: ['https://picsum.photos/800/600?random=56'],
        isNew: true,
        isFeatured: false,
    },
    {
        title: 'Dresser',
        subtitle: 'Bedroom essential',
        description: '6-drawer dresser with mirror. Ample storage for your bedroom.',
        price: 6500000,
        category: 'Storage',
        stock: 18,
        image: 'https://picsum.photos/800/600?random=57',
        images: ['https://picsum.photos/800/600?random=58'],
        isNew: false,
        isFeatured: true,
    },
    {
        title: 'Storage Ottoman',
        subtitle: 'Hidden storage',
        description: 'Versatile ottoman with hidden storage. Use as seating or footrest.',
        price: 1500000,
        category: 'Storage',
        stock: 45,
        image: 'https://picsum.photos/800/600?random=59',
        images: ['https://picsum.photos/800/600?random=60'],
        isNew: false,
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
            isEmailVerified: true,
        });
        console.log('✅ Created admin user (admin@ecommerce.com / admin123)');

        // Create test user
        const testPassword = await bcrypt.hash('user123', 10);
        await userModel.create({
            name: 'Test User',
            email: 'user@ecommerce.com',
            password: testPassword,
            role: 'user',
            isEmailVerified: true,
        });
        console.log('✅ Created test user (user@ecommerce.com / user123)');

        // Create vendor user
        const vendorPassword = await bcrypt.hash('vendor123', 10);
        await userModel.create({
            name: 'Test Vendor',
            email: 'vendor@ecommerce.com',
            password: vendorPassword,
            role: 'vendor',
            isEmailVerified: true,
            isApproved: true,
            vendorDetails: {
                businessName: 'Funiro Furniture',
                address: '123 Furniture Street',
                phone: '+1234567890',
                taxId: 'TAX123456',
                description: 'Premium furniture supplier',
            },
        });
        console.log('✅ Created vendor user (vendor@ecommerce.com / vendor123)');

        console.log('\n🎉 Database seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await app.close();
    }
}

seed();
