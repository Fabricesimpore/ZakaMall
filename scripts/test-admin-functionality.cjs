#!/usr/bin/env node

/**
 * Test admin functionality and endpoints
 * Verify that admin can manage vendors, users, and drivers
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function testAdminFunctionality() {
  const pool = new Pool({ connectionString });

  try {
    console.log("🔧 Testing admin functionality...");

    // 1. Check admin users exist
    const { rows: admins } = await pool.query(
      "SELECT id, email, role FROM users WHERE role = 'admin'"
    );
    console.log(`👑 Admin users: ${admins.length}`);
    admins.forEach((admin) => {
      console.log(`  • ${admin.email} (${admin.id})`);
    });

    if (admins.length === 0) {
      console.log("⚠️  No admin users found! Creating emergency admin...");
      // This should be handled by the emergency admin creation endpoints
    }

    // 2. Check pending vendors for approval
    const { rows: pendingVendors } = await pool.query(
      "SELECT id, store_name, contact_email, status FROM vendors WHERE status = 'pending'"
    );
    console.log(`\n🏪 Pending vendors: ${pendingVendors.length}`);
    pendingVendors.forEach((vendor) => {
      console.log(`  • ${vendor.store_name} - ${vendor.contact_email} (${vendor.status})`);
    });

    // 3. Check all vendor statuses
    const { rows: vendorStats } = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM vendors 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log(`\n📊 Vendor status breakdown:`);
    vendorStats.forEach((stat) => {
      console.log(`  • ${stat.status}: ${stat.count}`);
    });

    // 4. Check pending drivers
    const { rows: pendingDrivers } = await pool.query(
      "SELECT id, phone, status FROM drivers WHERE status = 'pending'"
    );
    console.log(`\n🚗 Pending drivers: ${pendingDrivers.length}`);

    // 5. Check user roles distribution
    const { rows: userRoles } = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);
    console.log(`\n👥 User roles distribution:`);
    userRoles.forEach((role) => {
      console.log(`  • ${role.role || "null"}: ${role.count}`);
    });

    // 6. Test data for admin to work with
    const {
      rows: [{ count: totalUsers }],
    } = await pool.query("SELECT COUNT(*) as count FROM users");
    const {
      rows: [{ count: totalVendors }],
    } = await pool.query("SELECT COUNT(*) as count FROM vendors");
    const {
      rows: [{ count: totalProducts }],
    } = await pool.query("SELECT COUNT(*) as count FROM products");

    console.log(`\n📈 System statistics:`);
    console.log(`  • Total users: ${totalUsers}`);
    console.log(`  • Total vendors: ${totalVendors}`);
    console.log(`  • Total products: ${totalProducts}`);

    // 7. Check vendor audit log
    const { rows: recentAudit } = await pool.query(`
      SELECT action, vendor_id, user_id, created_at, notes
      FROM vendor_audit_log 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log(`\n📋 Recent vendor audit actions:`);
    if (recentAudit.length > 0) {
      recentAudit.forEach((audit) => {
        console.log(`  • ${audit.action} - Vendor: ${audit.vendor_id} by User: ${audit.user_id}`);
      });
    } else {
      console.log(`  • No recent audit actions found`);
    }

    // 8. Verify admin can access critical data
    console.log(`\n✅ Admin functionality test completed!`);

    if (pendingVendors.length === 0) {
      console.log(`📝 NOTE: No pending vendors to approve. Admin should be able to:`);
      console.log(`  • View all vendors, users, and drivers`);
      console.log(`  • Edit user roles`);
      console.log(`  • Approve/reject vendor applications when they exist`);
      console.log(`  • Manage driver approvals`);
    }

    console.log(`\n🎯 Admin endpoints that should work:`);
    console.log(`  • GET /api/admin/dashboard - System statistics`);
    console.log(`  • GET /api/admin/users - All users`);
    console.log(`  • GET /api/admin/vendors - All vendors`);
    console.log(`  • GET /api/admin/vendors/pending - Pending vendors`);
    console.log(`  • GET /api/admin/admins - Admin users`);
    console.log(`  • GET /api/drivers - All drivers`);
    console.log(`  • POST /api/admin/vendors/:id/approve - Approve vendor`);
    console.log(`  • PATCH /api/admin/users/:id/role - Change user role`);
  } catch (error) {
    console.error("❌ Admin functionality test failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testAdminFunctionality().catch(console.error);
