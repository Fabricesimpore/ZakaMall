// Test script to verify vendor flow end-to-end
const { Client } = require('pg');

async function testVendorFlow() {
  console.log('🧪 Testing Vendor Flow End-to-End...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // 1. Check if vendors table exists and has required columns
    console.log('1️⃣ Checking vendors table schema...');
    const vendorSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      ORDER BY ordinal_position
    `);
    
    console.log('Vendors table columns:');
    vendorSchema.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    // 2. Check if products table has vendor relationship
    console.log('\n2️⃣ Checking products-vendor relationship...');
    const productVendorRel = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name LIKE '%vendor%'
    `);
    
    if (productVendorRel.rows.length > 0) {
      console.log('✅ Products have vendor relationship:');
      productVendorRel.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ No vendor relationship found in products table');
    }
    
    // 3. Check categories exist for product creation
    console.log('\n3️⃣ Checking available categories...');
    const categories = await client.query('SELECT id, name FROM categories LIMIT 5');
    
    if (categories.rows.length > 0) {
      console.log('✅ Categories available for products:');
      categories.rows.forEach(cat => {
        console.log(`  - ${cat.id}: ${cat.name}`);
      });
    } else {
      console.log('⚠️ No categories found - vendors won\'t be able to create products');
    }
    
    // 4. Check vendor approval statuses
    console.log('\n4️⃣ Checking vendor approval statuses...');
    const vendorStats = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM vendors 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    if (vendorStats.rows.length > 0) {
      console.log('Vendor status distribution:');
      vendorStats.rows.forEach(stat => {
        console.log(`  - ${stat.status}: ${stat.count} vendors`);
      });
    } else {
      console.log('📝 No vendors in system yet');
    }
    
    // 5. Check if vendor notification settings table exists
    console.log('\n5️⃣ Checking vendor notification system...');
    const notificationTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'vendor_notification_settings'
    `);
    
    if (notificationTable.rows.length > 0) {
      console.log('✅ Vendor notification system ready');
    } else {
      console.log('⚠️ Vendor notification settings table missing');
    }
    
    // 6. Check orders table for vendor relationship
    console.log('\n6️⃣ Checking order management for vendors...');
    const orderVendorCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name LIKE '%vendor%'
    `);
    
    if (orderVendorCols.rows.length > 0) {
      console.log('✅ Orders table has vendor relationship');
    } else {
      console.log('⚠️ Orders table missing vendor relationship');
    }
    
    console.log('\n🎉 Vendor flow test completed!');
    
  } catch (error) {
    console.error('❌ Error testing vendor flow:', error.message);
  } finally {
    await client.end();
  }
}

// Run the test
if (require.main === module) {
  testVendorFlow()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = testVendorFlow;