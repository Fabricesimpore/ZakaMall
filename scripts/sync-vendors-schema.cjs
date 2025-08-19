const { Client } = require('pg');

async function syncVendorsSchema() {
  console.log('🔄 Syncing vendors table schema with current requirements...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get current columns in vendors table
    const currentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Current vendors table columns:');
    currentColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    const existingColumns = currentColumns.rows.map(row => row.column_name);

    // Define all required columns based on current schema
    const requiredColumns = [
      { name: 'shop_name', type: 'VARCHAR', nullable: true },
      { name: 'identity_document_photo', type: 'TEXT', nullable: true },
      { name: 'business_license_photo', type: 'TEXT', nullable: true },
      { name: 'mobile_money_number', type: 'VARCHAR', nullable: true },
      { name: 'mobile_money_name', type: 'VARCHAR', nullable: true },
      { name: 'payment_method', type: 'VARCHAR', nullable: true }
    ];

    let addedColumns = 0;

    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding missing column: ${column.name}`);
        
        const nullableClause = column.nullable ? '' : ' NOT NULL';
        await client.query(`
          ALTER TABLE vendors 
          ADD COLUMN ${column.name} ${column.type}${nullableClause};
        `);
        
        console.log(`✅ Added column: ${column.name}`);
        addedColumns++;
      } else {
        console.log(`ℹ️  Column already exists: ${column.name}`);
      }
    }

    if (addedColumns > 0) {
      console.log(`🎉 Successfully added ${addedColumns} missing columns to vendors table`);
    } else {
      console.log('ℹ️  All required columns already exist');
    }

    // Verify all columns exist now
    const finalColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vendors' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Final vendors table columns:');
    finalColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

    console.log('✅ Vendors schema sync completed successfully');

  } catch (error) {
    console.error('❌ Error syncing vendors schema:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  syncVendorsSchema()
    .then(() => {
      console.log('🎉 Vendors schema sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Vendors schema sync failed:', error);
      process.exit(1);
    });
}

module.exports = syncVendorsSchema;