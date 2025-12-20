import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { ProductsService } from '../products/products.service';
import { VendorsService } from '../vendors/vendors.service';
import { CouponsService } from '../coupons/coupons.service';
import { CouponType } from '../coupons/schemas/coupon.schema';
import { TopCategory, SubCategory } from '../products/schemas/product.schema';
import { UserRole } from '../auth/schemas/user.schema';

async function seedClothingData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const productsService = app.get(ProductsService);
  const vendorsService = app.get(VendorsService);
  const couponsService = app.get(CouponsService);

  console.log('🌱 Starting clothing marketplace seeding...');

  try {
    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    let admin;
    try {
      admin = await authService.register({
        name: 'Admin User',
        email: 'admin@clothingstore.com',
        password: 'admin123',
        confirmPassword: 'admin123',
        role: UserRole.ADMIN,
      });
      console.log('✅ Admin user created successfully');
    } catch (error) {
      console.log('ℹ️ Admin user already exists');
    }

    // 2. Create Test Customers
    console.log('👥 Creating test customers...');
    const testUsers = [
      {
        name: 'John Customer',
        email: 'customer@example.com',
        password: 'customer123',
        confirmPassword: 'customer123',
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
      {
        name: 'Mike Wilson',
        email: 'mike@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
    ];

    const createdUsers: any[] = [];
    for (const userData of testUsers) {
      try {
        const user = await authService.register(userData);
        createdUsers.push(user.user);
        console.log(`✅ Customer ${userData.name} created`);
      } catch (error) {
        console.log(`ℹ️ Customer ${userData.name} already exists`);
      }
    }

    // 3. Create Test Vendors
    console.log('🏪 Creating test vendors...');
    const testVendors = [
      {
        name: 'Fashion Hub Vendor',
        email: 'vendor1@fashionhub.com',
        password: 'vendor123',
        confirmPassword: 'vendor123',
        shopName: 'Fashion Hub',
        businessName: 'Fashion Hub Pvt Ltd',
      },
      {
        name: 'Style Store Vendor',
        email: 'vendor2@stylestore.com',
        password: 'vendor123',
        confirmPassword: 'vendor123',
        shopName: 'Style Store',
        businessName: 'Style Store LLC',
      },
      {
        name: 'Trendy Clothes Vendor',
        email: 'vendor3@trendy.com',
        password: 'vendor123',
        confirmPassword: 'vendor123',
        shopName: 'Trendy Clothes',
        businessName: 'Trendy Clothes Inc',
      },
    ];

    const createdVendors: any[] = [];
    for (const vendorData of testVendors) {
      try {
        // Create user account
        const user = await authService.register({
          name: vendorData.name,
          email: vendorData.email,
          password: vendorData.password,
          confirmPassword: vendorData.confirmPassword,
          role: 'vendor',
        });

        // Create vendor application
        const vendorApplication = {
          shopName: vendorData.shopName,
          businessName: vendorData.businessName,
          businessType: 'Company',
          contactPerson: vendorData.name,
          phoneNumber: '+1234567890',
          alternatePhone: '+1234567891',
          email: vendorData.email,
          businessAddress: {
            street: '123 Business St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
          },
          pickupAddress: {
            street: '123 Business St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
          },
          bankDetails: {
            accountHolderName: vendorData.businessName,
            accountNumber: '1234567890',
            bankName: 'Test Bank',
            ifscCode: 'TEST0001',
            branchName: 'Main Branch',
          },
          taxDetails: {
            gstNumber: 'GST123456789',
            panNumber: 'PAN123456',
          },
          documents: {
            businessLicense: '/uploads/license.pdf',
            taxCertificate: '/uploads/tax.pdf',
            identityProof: '/uploads/id.pdf',
            addressProof: '/uploads/address.pdf',
          },
          specialties: ['Men\'s Wear', 'Women\'s Wear'],
          establishedYear: 2020,
        };

        const vendor = await vendorsService.createVendorApplication(
          user.user.id.toString(),
          vendorApplication,
        );

        // Auto-approve for demo
        await vendorsService.approveVendor((vendor as any)._id, (admin as any)._id);
        
        createdVendors.push({ ...vendor, userId: user.user.id });
        console.log(`✅ Vendor ${vendorData.shopName} created and approved`);
      } catch (error) {
        console.log(`❌ Failed to create vendor ${vendorData.shopName}:`, error.message);
      }
    }

    // 4. Create Clothing Products
    console.log('👕 Creating clothing products...');
    const clothingProducts = [
      // Men's Clothing
      {
        title: 'Classic Cotton T-Shirt',
        subtitle: 'Comfortable everyday wear',
        description: 'Premium quality cotton t-shirt perfect for casual wear. Available in multiple colors and sizes.',
        price: 25.99,
        originalPrice: 35.99,
        discount: 28,
        topCategory: TopCategory.MEN,
        subCategory: SubCategory.T_SHIRTS,
        colors: ['White', 'Black', 'Navy', 'Gray'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        stock: 100,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        material: 'Cotton',
        brand: 'Fashion Hub',
        gender: 'Male',
        tags: ['casual', 'cotton', 'comfortable'],
        sku: 'MTS001',
        isNew: true,
        isFeatured: true,
      },
      {
        title: 'Slim Fit Jeans',
        subtitle: 'Modern slim fit denim',
        description: 'Stylish slim fit jeans made from premium denim. Perfect for both casual and semi-formal occasions.',
        price: 79.99,
        originalPrice: 99.99,
        discount: 20,
        topCategory: TopCategory.MEN,
        subCategory: SubCategory.JEANS,
        colors: ['Blue', 'Black', 'Dark Blue'],
        sizes: ['28', '30', '32', '34', '36', '38'],
        stock: 75,
        image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
        material: 'Denim',
        brand: 'Style Store',
        gender: 'Male',
        tags: ['denim', 'slim-fit', 'casual'],
        sku: 'MJ001',
        isNew: false,
        isFeatured: true,
      },
      {
        title: 'Formal Dress Shirt',
        subtitle: 'Professional business shirt',
        description: 'Crisp formal dress shirt perfect for office wear and business meetings. Easy care fabric.',
        price: 45.99,
        originalPrice: 59.99,
        discount: 23,
        topCategory: TopCategory.MEN,
        subCategory: SubCategory.DRESS_SHIRTS,
        colors: ['White', 'Light Blue', 'Pink'],
        sizes: ['S', 'M', 'L', 'XL'],
        stock: 60,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
        material: 'Cotton Blend',
        brand: 'Fashion Hub',
        gender: 'Male',
        tags: ['formal', 'business', 'professional'],
        sku: 'MDS001',
        isNew: true,
        isFeatured: false,
      },

      // Women's Clothing
      {
        title: 'Floral Summer Dress',
        subtitle: 'Elegant floral print dress',
        description: 'Beautiful floral print dress perfect for summer occasions. Lightweight and comfortable fabric.',
        price: 65.99,
        originalPrice: 89.99,
        discount: 27,
        topCategory: TopCategory.WOMEN,
        subCategory: SubCategory.STITCHED,
        colors: ['Floral Blue', 'Floral Pink', 'Floral Yellow'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        stock: 45,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop',
        material: 'Polyester',
        brand: 'Trendy Clothes',
        gender: 'Female',
        tags: ['floral', 'summer', 'elegant'],
        sku: 'WD001',
        isNew: true,
        isFeatured: true,
      },
      {
        title: 'High-Waist Skinny Jeans',
        subtitle: 'Trendy high-waist denim',
        description: 'Fashionable high-waist skinny jeans that provide a flattering fit. Made from stretch denim for comfort.',
        price: 69.99,
        originalPrice: 89.99,
        discount: 22,
        topCategory: TopCategory.WOMEN,
        subCategory: SubCategory.JEANS,
        colors: ['Blue', 'Black', 'White'],
        sizes: ['24', '26', '28', '30', '32'],
        stock: 80,
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop',
        material: 'Stretch Denim',
        brand: 'Style Store',
        gender: 'Female',
        tags: ['high-waist', 'skinny', 'stretch'],
        sku: 'WJ001',
        isNew: false,
        isFeatured: true,
      },
      {
        title: 'Silk Blouse',
        subtitle: 'Luxurious silk top',
        description: 'Elegant silk blouse perfect for formal occasions and office wear. Premium quality silk fabric.',
        price: 89.99,
        originalPrice: 119.99,
        discount: 25,
        topCategory: TopCategory.WOMEN,
        subCategory: SubCategory.SHIRTS,
        colors: ['Ivory', 'Black', 'Navy'],
        sizes: ['XS', 'S', 'M', 'L'],
        stock: 35,
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
        material: 'Silk',
        brand: 'Fashion Hub',
        gender: 'Female',
        tags: ['silk', 'elegant', 'formal'],
        sku: 'WB001',
        isNew: true,
        isFeatured: false,
      },

      // Kids Clothing
      {
        title: 'Kids Cotton T-Shirt',
        subtitle: 'Soft and comfortable for kids',
        description: 'Super soft cotton t-shirt designed for kids. Fun prints and comfortable fit for active children.',
        price: 18.99,
        originalPrice: 24.99,
        discount: 24,
        topCategory: TopCategory.KIDS,
        subCategory: SubCategory.KIDS_CASUAL,
        colors: ['Red', 'Blue', 'Green', 'Yellow'],
        sizes: ['2T', '3T', '4T', '5T', '6T'],
        stock: 120,
        image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400&h=400&fit=crop',
        material: 'Cotton',
        brand: 'Trendy Clothes',
        gender: 'Unisex',
        tags: ['kids', 'cotton', 'comfortable'],
        sku: 'KT001',
        isNew: true,
        isFeatured: true,
      },
      {
        title: 'School Uniform Shirt',
        subtitle: 'Formal school wear',
        description: 'Crisp white school uniform shirt. Durable and easy to maintain for daily school wear.',
        price: 22.99,
        originalPrice: 29.99,
        discount: 23,
        topCategory: TopCategory.KIDS,
        subCategory: SubCategory.KIDS_SCHOOL,
        colors: ['White', 'Light Blue'],
        sizes: ['4', '6', '8', '10', '12', '14'],
        stock: 90,
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop',
        material: 'Cotton Blend',
        brand: 'Style Store',
        gender: 'Unisex',
        tags: ['school', 'uniform', 'formal'],
        sku: 'KU001',
        isNew: false,
        isFeatured: false,
      },

      // Footwear
      {
        title: 'Running Sneakers',
        subtitle: 'Comfortable athletic shoes',
        description: 'High-performance running sneakers with excellent cushioning and support. Perfect for sports and casual wear.',
        price: 89.99,
        originalPrice: 119.99,
        discount: 25,
        topCategory: TopCategory.FOOTWEAR,
        subCategory: SubCategory.SNEAKERS,
        colors: ['White', 'Black', 'Gray'],
        sizes: ['7', '8', '9', '10', '11', '12'],
        stock: 60,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
        material: 'Synthetic',
        brand: 'Fashion Hub',
        gender: 'Unisex',
        tags: ['running', 'athletic', 'comfortable'],
        sku: 'FS001',
        isNew: true,
        isFeatured: true,
      },
      {
        title: 'Leather Formal Shoes',
        subtitle: 'Classic business footwear',
        description: 'Premium leather formal shoes perfect for business meetings and formal occasions. Handcrafted quality.',
        price: 129.99,
        originalPrice: 169.99,
        discount: 24,
        topCategory: TopCategory.FOOTWEAR,
        subCategory: SubCategory.FORMAL_SHOES,
        colors: ['Black', 'Brown'],
        sizes: ['7', '8', '9', '10', '11', '12'],
        stock: 40,
        image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=400&fit=crop',
        material: 'Leather',
        brand: 'Style Store',
        gender: 'Male',
        tags: ['leather', 'formal', 'business'],
        sku: 'FF001',
        isNew: false,
        isFeatured: true,
      },
    ];

    const createdProducts: any[] = [];
    
    // Only create products if we have vendors
    if (createdVendors.length === 0) {
      console.log('⚠️ No vendors available, skipping product creation');
    } else {
      for (let i = 0; i < clothingProducts.length; i++) {
        const productData = clothingProducts[i];
        try {
          // Assign to different vendors
          const vendorIndex = i % createdVendors.length;
          const vendor = createdVendors[vendorIndex];
          
          const product = await productsService.create({
            ...productData,
            vendor: vendor.userId,
            isApproved: true, // Auto-approve for demo
          });
          
          createdProducts.push(product);
          console.log(`✅ Product "${productData.title}" created`);
        } catch (error) {
          console.log(`❌ Failed to create product "${productData.title}":`, error.message);
        }
      }
    }

    // 5. Create Clothing-Specific Coupons
    console.log('🎫 Creating clothing coupons...');
    const clothingCoupons = [
      {
        code: 'FASHION20',
        name: 'Fashion Sale',
        description: '20% off on all fashion items',
        type: CouponType.PERCENTAGE,
        value: 20,
        minimumOrderAmount: 50,
        maximumDiscountAmount: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 500,
        usageLimitPerUser: 2,
      },
      {
        code: 'NEWUSER15',
        name: 'New User Discount',
        description: '15% off for first-time shoppers',
        type: CouponType.PERCENTAGE,
        value: 15,
        minimumOrderAmount: 30,
        maximumDiscountAmount: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        usageLimitPerUser: 1,
        isFirstTimeUser: true,
      },
      {
        code: 'FREESHIP',
        name: 'Free Shipping',
        description: 'Free shipping on all orders',
        type: CouponType.FREE_SHIPPING,
        value: 0,
        minimumOrderAmount: 75,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        usageLimit: 0,
        usageLimitPerUser: 5,
      },
      {
        code: 'SUMMER50',
        name: 'Summer Sale',
        description: '$50 off on summer collection',
        type: CouponType.FIXED_AMOUNT,
        value: 50,
        minimumOrderAmount: 200,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        usageLimit: 100,
        usageLimitPerUser: 1,
      },
    ];

    for (const couponData of clothingCoupons) {
      try {
        await couponsService.createCoupon(couponData, 'admin-id');
        console.log(`✅ Coupon "${couponData.code}" created`);
      } catch (error) {
        console.log(`❌ Failed to create coupon "${couponData.code}":`, error.message);
      }
    }

    console.log('🎉 Clothing marketplace seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Products created: ${createdProducts.length}`);
    console.log(`- Vendors created: ${createdVendors.length}`);
    console.log(`- Customers created: ${createdUsers.length}`);
    console.log(`- Coupons created: ${clothingCoupons.length}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Admin: admin@clothingstore.com / admin123');
    console.log('Customer: customer@example.com / customer123');
    console.log('Vendor 1: vendor1@fashionhub.com / vendor123');
    console.log('Vendor 2: vendor2@stylestore.com / vendor123');
    
    console.log('\n🎫 Test Coupons:');
    console.log('- FASHION20 (20% off fashion items)');
    console.log('- NEWUSER15 (15% off for new users)');
    console.log('- FREESHIP (Free shipping)');
    console.log('- SUMMER50 ($50 off summer collection)');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

seedClothingData();