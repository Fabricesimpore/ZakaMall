const { Client } = require('pg');

async function restoreAdminRole() {
  console.log('🔧 Restoring admin role for admin user...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Find user(s) that should be admin (you can modify the email here)
    const adminEmails = [
      'simporefabrice15@gmail.com', // Protected admin email
      // Add more admin emails if needed
    ];

    for (const email of adminEmails) {
      console.log(`🔍 Looking for user with email: ${email}`);
      
      const userResult = await client.query(
        'SELECT id, email, role FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      const user = userResult.rows[0];
      console.log(`📋 Current user data:`, user);

      if (user.role === 'admin') {
        console.log(`✅ User ${email} already has admin role`);
        continue;
      }

      // Update user role to admin
      console.log(`🔄 Updating ${email} to admin role...`);
      await client.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        ['admin', user.id]
      );

      console.log(`✅ Successfully updated ${email} to admin role`);
    }

    console.log('🎉 Admin role restoration completed');

  } catch (error) {
    console.error('❌ Error restoring admin role:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  restoreAdminRole()
    .then(() => {
      console.log('🎉 Admin role restoration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin role restoration failed:', error);
      process.exit(1);
    });
}

module.exports = restoreAdminRole;