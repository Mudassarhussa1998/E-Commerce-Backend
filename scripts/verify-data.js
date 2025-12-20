const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function verifyData() {
  try {
    console.log('🔍 Verifying database data...\n');
    
    // Check products
    const productsRes = await axios.get(`${API_URL}/products`);
    const products = productsRes.data;
    console.log(`✅ Products: ${products.total} total`);
    console.log(`   - Active products: ${products.products.length}`);
    console.log(`   - Categories: ${[...new Set(products.products.map(p => p.topCategory))].join(', ')}`);
    
    // Check vendors
    const vendorsRes = await axios.get(`${API_URL}/vendors/search?q=`);
    const vendors = vendorsRes.data.vendors;
    console.log(`✅ Vendors: ${vendors.length} total`);
    console.log(`   - Approved: ${vendors.filter(v => v.status === 'approved').length}`);
    console.log(`   - Pending: ${vendors.filter(v => v.status === 'pending').length}`);
    
    // Check image paths
    const imageIssues = products.products.filter(p => 
      p.image && p.image.includes('.png')
    );
    
    if (imageIssues.length > 0) {
      console.log(`⚠️  Image issues found: ${imageIssues.length} products still using .png paths`);
    } else {
      console.log('✅ All image paths are correct');
    }
    
    console.log('\n🎉 Database verification completed!');
    console.log('\n📊 Sample data summary:');
    products.products.slice(0, 5).forEach(p => {
      console.log(`   - ${p.title} ($${p.price}) - ${p.topCategory}`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

verifyData();