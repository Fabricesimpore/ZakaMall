#!/usr/bin/env node

/**
 * Test users database queries to identify 502 error cause
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function testUsersDatabase() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log("🔍 Testing users database...");

    // 1. Check users table structure
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY column_name
    `);
    
    console.log("📋 Users table columns:");
    columns.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 2. Test basic select query
    console.log("\n🔍 Testing basic SELECT...");
    const { rows: [{ count }] } = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log(`✅ Total users: ${count}`);

    // 3. Test SELECT with ORDER BY (mimicking getAllUsers)
    console.log("\n🔍 Testing SELECT with ORDER BY (getAllUsers query)...");
    const { rows: users } = await pool.query(`
      SELECT id, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`✅ Sample users (${users.length}):`);
    users.forEach(user => {
      console.log(`  • ${user.email} - ${user.role || 'null'} (${user.id})`);
    });

    // 4. Check for admin users
    const { rows: admins } = await pool.query(
      "SELECT id, email, role FROM users WHERE role = 'admin'"
    );
    console.log(`\n👑 Admin users: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`  • ${admin.email} (${admin.id})`);
    });

    // 5. Check for any NULL or problematic data
    const { rows: [{ nullRoles }] } = await pool.query(
      "SELECT COUNT(*) as nullRoles FROM users WHERE role IS NULL"
    );
    console.log(`\n⚠️ Users with NULL role: ${nullRoles}`);

    // 6. Test the exact query that getAllUsers uses
    console.log("\n🔍 Testing exact getAllUsers query...");
    const startTime = Date.now();
    const { rows: allUsers } = await pool.query(`
      SELECT * FROM users ORDER BY created_at DESC
    `);
    const endTime = Date.now();
    
    console.log(`✅ getAllUsers query completed in ${endTime - startTime}ms`);
    console.log(`📊 Returned ${allUsers.length} users`);

    // 7. Check for any large text fields that might cause issues
    const { rows: largeFields } = await pool.query(`
      SELECT 
        COUNT(CASE WHEN LENGTH(email) > 100 THEN 1 END) as long_emails,
        COUNT(CASE WHEN LENGTH(first_name) > 50 THEN 1 END) as long_first_names,
        COUNT(CASE WHEN LENGTH(last_name) > 50 THEN 1 END) as long_last_names
      FROM users
    `);
    
    console.log("\n📏 Field length analysis:");
    console.log(`  • Long emails (>100): ${largeFields[0].long_emails}`);
    console.log(`  • Long first names (>50): ${largeFields[0].long_first_names}`);
    console.log(`  • Long last names (>50): ${largeFields[0].long_last_names}`);

    console.log("\n✅ Users database test completed successfully!");
    console.log("📝 If getAllUsers query works here, the issue might be:");
    console.log("  • Authentication/authorization in the API endpoint");
    console.log("  • Request timeout issues");
    console.log("  • ORM/Drizzle query translation problems");

  } catch (error) {
    console.error("❌ Users database test failed:", error);
    console.error("Full error:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testUsersDatabase().catch(console.error);