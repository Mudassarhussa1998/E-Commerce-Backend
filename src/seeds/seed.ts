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
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
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
        image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800',
        images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800'],
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
        image: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800',
        images: ['https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800'],
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
        image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800',
        images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800'],
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
        image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
        images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'],
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
        image: 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?w=800',
        images: ['https://images.unsplash.com/photo-1558211583-d26f610c1eb1?w=800'],
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
        image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
        images: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800'],
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
        image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800',
        images: ['https://images.unsplash.com/photo-1503602642458-232111445657?w=800'],
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
        image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
        images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
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
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800',
        images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800'],
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
        image: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800',
        images: ['https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800'],
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
        image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800',
        images: ['https://images.unsplash.com/photo-1503602642458-232111445657?w=800'],
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
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
        images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800'],
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
        image: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=800',
        images: ['https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=800'],
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
        image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800',
        images: ['https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800'],
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
        image: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?w=800',
        images: ['https://images.unsplash.com/photo-1499933374294-4584851497cc?w=800'],
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
        image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800',
        images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800'],
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
        image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800',
        images: ['https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800'],
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
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
        images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'],
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
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
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
        image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
        images: ['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800'],
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
        image: 'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=800',
        images: ['https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=800'],
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
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
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
        image: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800',
        images: ['https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800'],
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
        image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800',
        images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800'],
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
        image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800',
        images: ['https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800'],
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
        image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800',
        images: ['https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800'],
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
        image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800',
        images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800'],
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
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
        images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'],
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
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
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
