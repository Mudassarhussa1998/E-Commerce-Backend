const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function loginAsAdmin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ecommerce.com',
      password: 'admin123'
    });
    return response.data.accessToken;
  } catch (error) {
    console.error('Failed to login as admin:', error.response?.data || error.message);
    return null;
  }
}

async function fixAllProductImages(token) {
  try {
    // Get all products
    const response = await axios.get(`${API_URL}/products?limit=100`);
    const products = response.data.products;
    
    console.log(`Found ${products.length} products to check...`);
    
    for (const product of products) {
      let needsUpdate = false;
      const updates = {};
      
      // Fix main image path
      if (product.image === '/images/default-product.png') {
        updates.image = '/images/default-product.svg';
        needsUpdate = true;
      }
      
      // Fix images array if needed
      if (product.images && product.images.length > 0) {
        const fixedImages = product.images.map(img => {
          if (img === '/images/default-product.png') {
            return '/images/default-product.svg';
          }
          return img;
        });
        
        if (JSON.stringify(fixedImages) !== JSON.stringify(product.images)) {
          updates.images = fixedImages;
          needsUpdate = true;
        }
      }
      
      // Update product if needed
      if (needsUpdate) {
        try {
          await axios.patch(`${API_URL}/products/${product._id}`, updates, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Fixed image paths for: ${product.title}`);
        } catch (error) {
          console.error(`❌ Failed to update ${product.title}:`, error.response?.data || error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Error fixing image paths:', error.response?.data || error.message);
  }
}

async function fixAllVendorImages(token) {
  try {
    // Get all vendors
    const response = await axios.get(`${API_URL}/vendors/search?q=`);
    const vendors = response.data.vendors;
    
    console.log(`Found ${vendors.length} vendors to check...`);
    
    for (const vendor of vendors) {
      let needsUpdate = false;
      const updates = {};
      
      // Fix shop logo path
      if (vendor.shopLogo === '/images/default-shop.png') {
        updates.shopLogo = '/images/default-shop.svg';
        needsUpdate = true;
      }
      
      // Fix shop banner path
      if (vendor.shopBanner === '/images/default-banner.png') {
        updates.shopBanner = '/images/default-banner.svg';
        needsUpdate = true;
      }
      
      // Update vendor if needed
      if (needsUpdate) {
        try {
          await axios.put(`${API_URL}/vendors/${vendor._id}/profile`, updates, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Fixed image paths for vendor: ${vendor.shopName}`);
        } catch (error) {
          console.error(`❌ Failed to update vendor ${vendor.shopName}:`, error.response?.data || error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Error fixing vendor image paths:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🔧 Fixing all image paths in database...');
  
  // Login as admin
  const token = await loginAsAdmin();
  if (!token) {
    console.error('❌ Could not login as admin. Make sure the backend is running and admin user exists.');
    return;
  }
  
  console.log('✅ Logged in as admin');
  
  // Fix all image paths
  await fixAllProductImages(token);
  await fixAllVendorImages(token);
  
  console.log('🎉 All image paths fixed successfully!');
}

// Run the script
main().catch(console.error);