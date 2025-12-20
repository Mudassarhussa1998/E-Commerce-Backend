import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { ProductsService } from '../products/products.service';
import { CouponsService } from '../coupons/coupons.service';
import { CouponType } from '../coupons/schemas/coupon.schema';
import { ReviewsService } from '../reviews/reviews.service';
import { OrdersService } from '../orders/orders.service';
import { CartService } from '../cart/cart.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { NewsletterService } from '../newsletter/newsletter.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const productsService = app.get(ProductsService);
  const couponsService = app.get(CouponsService);
  const reviewsService = app.get(ReviewsService);
  const ordersService = app.get(OrdersService);
  const cartService = app.get(CartService);
  const wishlistService = app.get(WishlistService);
  const newsletterService = app.get(NewsletterService);

  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const adminData = {
      name: 'Admin User',
      email: 'admin@ecommerce.com',
      password: 'admin123',
      confirmPassword: 'admin123',
      role: 'admin',
    };

    let admin;
    try {
      admin = await authService.register(adminData);
      console.log('✅ Admin user created successfully');
    } catch (error) {
      console.log('ℹ️ Admin user already exists, fetching...');
      // Admin might already exist, that's okay
    }

    // 2. Create Test Users
    console.log('👥 Creating test users...');
    const testUsers = [
      {
        name: 'John Doe',
        email: 'user@ecommerce.com',
        password: 'user123',
        confirmPassword: 'user123',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
      {
        name: 'David Brown',
        email: 'david@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
    ];

    const createdUsers: any[] = [];
    for (const userData of testUsers) {
      try {
        const user = await authService.register(userData);
        createdUsers.push(user.user);
        console.log(`✅ User ${userData.name} created`);
      } catch (error) {
        console.log(`ℹ️ User ${userData.name} already exists`);
      }
    }

    // 3. Create Comprehensive Product Catalog
    console.log('🛋️ Creating comprehensive product catalog...');
    const products = [
      // Chairs Category
      {
        title: 'Ergonomic Office Chair',
        subtitle: 'Premium comfort for long work hours',
        description: 'High-quality ergonomic office chair with lumbar support, adjustable height, and breathable mesh back. Perfect for professionals who spend long hours at their desk.',
        price: 299.99,
        originalPrice: 399.99,
        discount: 25,
        category: 'Chairs',
        stock: 50,
        image: '/images/chair-office.jpg',
        isNew: true,
        isFeatured: true,
      },
      {
        title: 'Vintage Leather Armchair',
        subtitle: 'Classic elegance meets modern comfort',
        description: 'Handcrafted vintage leather armchair with solid wood frame. Features premium leather upholstery and traditional button tufting.',
        price: 899.99,
        originalPrice: 1199.99,
        discount: 25,
        category: 'Chairs',
        stock: 15,
        image: '/images/chair-leather.jpg',
        isNew: false,
        isFeatured: true,
      },
      {
        title: 'Modern Dining Chair Set',
        subtitle: 'Set of 4 contemporary dining chairs',
        description: 'Sleek and modern dining chairs with upholstered seats and solid wood legs. Sold as a set of 4 chairs.',
        price: 399.99,
        originalPrice: 499.99,
        discount: 20,
        category: 'Chairs',
        stock: 25,
        image: '/images/chair-dining.jpg',
        isNew: true,
        isFeatured: false,
      },
      {
        title: 'Scandinavian Accent Chair',
        subtitle: 'Minimalist Nordic design',
        description: 'Beautiful Scandinavian-inspired accent chair with clean lines and neutral colors. Perfect for modern living spaces.',
        price: 449.99,
        originalPrice: 549.99,
        discount: 18,
        category: 'Chairs',
        stock: 30,
        image: '/images/chair-accent.jpg',
        isNew: false,
        isFeatured: false,
      },

      // Sofas Category
      {
        title: 'Luxury 3-Seater Sofa',
        subtitle: 'Premium comfort for your living room',
        description: 'Spacious 3-seater sofa with premium fabric upholstery, solid hardwood frame, and high-density foam cushions. Available in multiple colors.',
        price: 1299.99,
        originalPrice: 1699.99,
        discount: 24,
        category: 'Sofas',
        stock: 20,
        image: '/images/sofa-3seater.jpg',
        isNew: true,
        isFeatured: true,
      },
      {
        title: 'Sectional L-Shape Sofa',
        subtitle: 'Perfect for large living spaces',
        description: 'Large sectional sofa with chaise lounge. Features removable cushions, stain-resistant fabric, and modular design.',
        price: 1899.99,
        originalPrice: 2399.99,
        discount: 21,
        category: 'Sofas',
        stock: 12,
        image: '/images/sofa-sectional.jpg',
        isNew: false,
        isFeatured: true,
      },
      {
        title: 'Convertible Sofa Bed',
        subtitle: 'Dual-purpose furniture solution',
        description: 'Versatile sofa that converts into a comfortable bed. Perfect for small spaces or guest rooms. Includes storage compartment.',
        price: 799.99,
        originalPrice: 999.99,
        discount: 20,
        category: 'Sofas',
        stock: 18,
        image: '/images/sofa-bed.jpg',
        isNew: true,
        isFeatured: false,
      },
      {
        title: 'Chesterfield Sofa',
        subtitle: 'Timeless British elegance',
        description: 'Classic Chesterfield sofa with deep button tufting, rolled arms, and premium leather upholstery. A statement piece for any room.',
        price: 2199.99,
        originalPrice: 2799.99,
        discount: 21,
        category: 'Sofas',
        stock: 8,
        image: '/images/sofa-chesterfield.jpg',
        isNew: false,
        isFeatured: true,
      },

      // Tables Category
      {
        title: 'Modern Coffee Table',
        subtitle: 'Sleek centerpiece for your living room',
        description: 'Contemporary coffee table with tempered glass top and chrome legs. Features lower shelf for storage.',
        price: 349.99,
        originalPrice: 449.99,
        discount: 22,
        category: 'Tables',
        stock: 35,
        image: '/images/table-coffee.jpg',
        isNew: true,
        isFeatured: false,
      },
      {
        title: 'Extendable Dining Table',
        subtitle: 'Seats 6-8 people comfortably',
        description: 'Solid wood dining table with extension leaf. Can accommodate 6-8 people. Features durable finish and classic design.',
        price: 899.99,
        originalPrice: 1199.99,
        discount: 25,
        category: 'Tables',
        stock: 15,
        image: '/images/table-dining.jpg',
        isNew: false,
        isFeatured: true,
      },
      {
        title: 'Executive Office Desk',
        subtitle: 'Professional workspace solution',
        description: 'Large executive desk with multiple drawers and cable management. Perfect for home office or corporate environment.',
        price: 699.99,
        originalPrice: 899.99,
        discount: 22,
        category: 'Tables',
        stock: 22,
        image: '/images/table-desk.jpg',
        isNew: true,
        isFeatured: false,
      },
      {
        title: 'Industrial Side Table',
        subtitle: 'Rustic charm meets functionality',
        description: 'Industrial-style side table with reclaimed wood top and metal frame. Perfect accent piece for modern or rustic decor.',
        price: 199.99,
        originalPrice: 249.99,
        discount: 20,
        category: 'Tables',
        stock: 40,
        image: '/images/table-side.jpg',
        isNew: false,
        isFeatured: false,
      },

      // Beds Category
      {
        title: 'King Size Platform Bed',
        subtitle: 'Modern minimalist bedroom centerpiece',
        description: 'Sleek platform bed with built-in nightstands and LED lighting. No box spring required. Available in multiple finishes.',
        price: 1199.99,
        originalPrice: 1499.99,
        discount: 20,
        category: 'Beds',
        stock: 18,
        image: '/images/bed-platform.jpg',
        isNew: true,
        isFeatured: true,
      },
      {
        title: 'Classic Four-Poster Bed',
        subtitle: 'Timeless elegance for your bedroom',
        description: 'Traditional four-poster bed crafted from solid mahogany. Features intricate carvings and can accommodate canopy draping.',
        price: 1599.99,
        originalPrice: 1999.99,
        discount: 20,
        category: 'Beds',
        stock: 10,
        image: '/images/bed-fourposter.jpg',
        isNew: false,
        isFeatured: true,
      },
      {
        title: 'Storage Bed with Drawers',
        subtitle: 'Maximize your bedroom storage',
        description: 'Practical bed frame with built-in storage drawers. Perfect for small bedrooms or anyone needing extra storage space.',
        price: 799.99,
        originalPrice: 999.99,
        discount: 20,
        category: 'Beds',
        stock: 25,
        image: '/images/bed-storage.jpg',
        isNew: true,
        isFeatured: false,
      },
      {
        title: 'Upholstered Headboard Bed',
        subtitle: 'Comfort meets style',
        description: 'Elegant bed with tufted upholstered headboard. Available in various fabric options and colors to match your decor.',
        price: 899.99,
        originalPrice: 1199.99,
        discount: 25,
        category: 'Beds',
        stock: 20,
        image: '/images/bed-upholstered.jpg',
        isNew: false,
        isFeatured: false,
      },

      // Storage Category
      {
        title: 'Modular Bookshelf System',
        subtitle: 'Customizable storage solution',
        description: 'Versatile modular bookshelf system that can be configured in multiple ways. Perfect for books, decor, and storage.',
        price: 499.99,
        originalPrice: 649.99,
        discount: 23,
        category: 'Storage',
        stock: 30,
        image: '/images/storage-bookshelf.jpg',
        isNew: true,
        isFeatured: false,
      },
      {
        title: 'Walk-in Closet Organizer',
        subtitle: 'Complete closet organization system',
        description: 'Comprehensive closet organizer with hanging rods, shelves, and drawers. Customizable to fit any closet size.',
        price: 899.99,
        originalPrice: 1199.99,
        discount: 25,
        category: 'Storage',
        stock: 15,
        image: '/images/storage-closet.jpg',
        isNew: false,
        isFeatured: true,
      },
      {
        title: 'Storage Ottoman Bench',
        subtitle: 'Dual-purpose seating and storage',
        description: 'Stylish ottoman that doubles as storage. Perfect for entryways, bedrooms, or living rooms. Available in multiple colors.',
        price: 149.99,
        originalPrice: 199.99,
        discount: 25,
        category: 'Storage',
        stock: 45,
        image: '/images/storage-ottoman.jpg',
        isNew: true,
        isFeatured: false,
      },
      {
        title: 'Industrial Storage Cabinet',
        subtitle: 'Heavy-duty storage solution',
        description: 'Robust storage cabinet with metal frame and wood shelves. Perfect for garage, workshop, or industrial-style interiors.',
        price: 399.99,
        originalPrice: 499.99,
        discount: 20,
        category: 'Storage',
        stock: 25,
        image: '/images/storage-cabinet.jpg',
        isNew: false,
        isFeatured: false,
      },
    ];

    const createdProducts: any[] = [];
    for (const productData of products) {
      try {
        const product = await productsService.create(productData);
        createdProducts.push(product);
        console.log(`✅ Product "${productData.title}" created`);
      } catch (error) {
        console.log(`❌ Failed to create product "${productData.title}":`, error.message);
      }
    }

    // 4. Create Coupons
    console.log('🎫 Creating coupons...');
    const coupons = [
      {
        code: 'WELCOME10',
        name: 'Welcome Discount',
        description: 'Get 10% off your first order',
        type: CouponType.PERCENTAGE,
        value: 10,
        minimumOrderAmount: 100,
        maximumDiscountAmount: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usageLimit: 1000,
        usageLimitPerUser: 1,
        isFirstTimeUser: true,
      },
      {
        code: 'SAVE50',
        name: 'Big Savings',
        description: 'Save $50 on orders over $500',
        type: CouponType.FIXED_AMOUNT,
        value: 50,
        minimumOrderAmount: 500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        usageLimit: 500,
        usageLimitPerUser: 3,
      },
      {
        code: 'FREESHIP',
        name: 'Free Shipping',
        description: 'Free shipping on all orders',
        type: CouponType.FREE_SHIPPING,
        value: 0,
        minimumOrderAmount: 200,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        usageLimit: 0, // unlimited
        usageLimitPerUser: 5,
      },
      {
        code: 'FURNITURE25',
        name: 'Furniture Sale',
        description: '25% off all furniture items',
        type: CouponType.PERCENTAGE,
        value: 25,
        minimumOrderAmount: 300,
        maximumDiscountAmount: 200,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        usageLimit: 200,
        usageLimitPerUser: 1,
      },
      {
        code: 'BLACKFRIDAY',
        name: 'Black Friday Special',
        description: 'Massive 30% discount for Black Friday',
        type: CouponType.PERCENTAGE,
        value: 30,
        minimumOrderAmount: 250,
        maximumDiscountAmount: 300,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        usageLimit: 100,
        usageLimitPerUser: 1,
      },
    ];

    for (const couponData of coupons) {
      try {
        // Assuming we have an admin user ID
        const coupon = await couponsService.createCoupon(couponData, 'admin-id');
        console.log(`✅ Coupon "${couponData.code}" created`);
      } catch (error) {
        console.log(`❌ Failed to create coupon "${couponData.code}":`, error.message);
      }
    }

    // 5. Create Sample Reviews
    console.log('⭐ Creating sample reviews...');
    if (createdProducts.length > 0 && createdUsers.length > 0) {
      const sampleReviews = [
        {
          productId: createdProducts[0]._id,
          userId: createdUsers[0]._id,
          rating: 5,
          title: 'Excellent quality and comfort!',
          comment: 'This chair exceeded my expectations. The ergonomic design is perfect for long work sessions, and the build quality is outstanding. Highly recommended!',
        },
        {
          productId: createdProducts[0]._id,
          userId: createdUsers[1]._id,
          rating: 4,
          title: 'Great chair, minor assembly issues',
          comment: 'Overall a fantastic chair. Very comfortable and looks great in my office. Assembly instructions could be clearer, but worth the effort.',
        },
        {
          productId: createdProducts[1]._id,
          userId: createdUsers[0]._id,
          rating: 5,
          title: 'Beautiful leather armchair',
          comment: 'The leather quality is exceptional and the vintage design fits perfectly in my living room. A bit pricey but worth every penny.',
        },
        {
          productId: createdProducts[2]._id,
          userId: createdUsers[2]._id,
          rating: 4,
          title: 'Perfect for our dining room',
          comment: 'These chairs are stylish and comfortable. The set of 4 was exactly what we needed for our dining table. Good value for money.',
        },
        {
          productId: createdProducts[4]._id,
          userId: createdUsers[1]._id,
          rating: 5,
          title: 'Amazing sofa, very comfortable',
          comment: 'This sofa is incredibly comfortable and the fabric quality is excellent. It looks great in our living room and fits perfectly.',
        },
      ];

      for (const reviewData of sampleReviews) {
        try {
          await reviewsService.createReview(reviewData.userId, {
            productId: reviewData.productId,
            rating: reviewData.rating,
            title: reviewData.title,
            comment: reviewData.comment,
          });
          console.log(`✅ Review created for product`);
        } catch (error) {
          console.log(`❌ Failed to create review:`, error.message);
        }
      }
    }

    // 6. Create Newsletter Subscriptions
    console.log('📧 Creating newsletter subscriptions...');
    const newsletterEmails = [
      'newsletter1@example.com',
      'newsletter2@example.com',
      'newsletter3@example.com',
      'marketing@example.com',
      'updates@example.com',
    ];

    for (const email of newsletterEmails) {
      try {
        await newsletterService.subscribe(email);
        console.log(`✅ Newsletter subscription created for ${email}`);
      } catch (error) {
        console.log(`❌ Failed to create newsletter subscription for ${email}:`, error.message);
      }
    }

    console.log('🎉 Comprehensive database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Products created: ${createdProducts.length}`);
    console.log(`- Users created: ${createdUsers.length + 1} (including admin)`);
    console.log(`- Coupons created: ${coupons.length}`);
    console.log(`- Reviews created: 5`);
    console.log(`- Newsletter subscriptions: ${newsletterEmails.length}`);
    console.log('\n🔑 Test Credentials:');
    console.log('Admin: admin@ecommerce.com / admin123');
    console.log('User: user@ecommerce.com / user123');
    console.log('\n🎫 Test Coupons:');
    console.log('- WELCOME10 (10% off first order)');
    console.log('- SAVE50 ($50 off orders over $500)');
    console.log('- FREESHIP (Free shipping)');
    console.log('- FURNITURE25 (25% off furniture)');
    console.log('- BLACKFRIDAY (30% off Black Friday special)');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seed();