const { Client } = require('pg');

async function addShopNameColumn() {
  console.log('🔄 Adding shop_name column to vendors table...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' AND column_name = 'shop_name'
    `);

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  shop_name column already exists');
      return;
    }

    // Add the shop_name column
    await client.query(`
      ALTER TABLE vendors 
      ADD COLUMN shop_name VARCHAR;
    `);

    console.log('✅ Successfully added shop_name column to vendors table');

    // Verify the column was added
    const verifyResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' AND column_name = 'shop_name'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Column verified successfully');
    } else {
      console.error('❌ Column verification failed');
    }

  } catch (error) {
    console.error('❌ Error adding shop_name column:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  addShopNameColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addShopNameColumn;