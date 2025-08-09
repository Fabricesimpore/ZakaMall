#!/usr/bin/env node

/**
 * Script to make a user admin in ZakaMall
 * Run with: node make-admin.js <user-email>
 */

import { Pool } from 'pg';

const DATABASE_URL = "postgresql://postgres:WkNDVAmxKaRDJYpCqvHhXykoLcZpYBws@turntable.proxy.rlwy.net:48496/railway";

async function makeAdmin(email) {
  if (!email) {
    console.log('Usage: node make-admin.js <user-email>');
    console.log('Example: node make-admin.js your-email@example.com');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Find user by email
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log(`❌ User with email ${email} not found`);
      console.log('Available users:');
      const allUsers = await pool.query('SELECT email, role FROM users');
      allUsers.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    if (user.role === 'admin') {
      console.log('✅ User is already an admin!');
      process.exit(0);
    }

    // Update user role to admin
    await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      ['admin', user.id]
    );

    console.log('🎉 Successfully promoted user to admin!');
    console.log(`${user.first_name} ${user.last_name} (${user.email}) is now an admin`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Get email from command line args
const email = process.argv[2];
makeAdmin(email);