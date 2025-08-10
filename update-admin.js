#!/usr/bin/env node

/**
 * Script to update admin email and password in ZakaMall
 * Run with: node update-admin.js <current-email> <new-email> <new-password>
 */

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL =
  "postgresql://postgres:WkNDVAmxKaRDJYpCqvHhXykoLcZpYBws@turntable.proxy.rlwy.net:48496/railway";

async function updateAdmin(currentEmail, newEmail, newPassword) {
  if (!currentEmail || !newEmail || !newPassword) {
    console.log("Usage: node update-admin.js <current-email> <new-email> <new-password>");
    console.log("Example: node update-admin.js old@example.com new@example.com newpassword123");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Find current admin by email
    const userResult = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE email = $1 AND role = $2",
      [currentEmail, "admin"]
    );

    if (userResult.rows.length === 0) {
      console.log(`❌ Admin with email ${currentEmail} not found`);
      console.log("Available admins:");
      const allAdmins = await pool.query(
        "SELECT email, first_name, last_name FROM users WHERE role = $1",
        ["admin"]
      );
      allAdmins.rows.forEach((admin) => {
        console.log(`  - ${admin.email} (${admin.first_name} ${admin.last_name})`);
      });
      process.exit(1);
    }

    const admin = userResult.rows[0];
    console.log(`Found admin: ${admin.first_name} ${admin.last_name} (${admin.email})`);

    // Check if new email already exists (unless it's the same as current)
    if (newEmail !== currentEmail) {
      const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1", [newEmail]);

      if (emailCheck.rows.length > 0) {
        console.log(`❌ Email ${newEmail} is already in use by another user`);
        process.exit(1);
      }
    }

    // Hash new password
    console.log("🔒 Hashing new password...");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin email and password
    await pool.query(
      "UPDATE users SET email = $1, password = $2, updated_at = NOW() WHERE id = $3",
      [newEmail, hashedPassword, admin.id]
    );

    console.log("🎉 Admin credentials updated successfully!");
    console.log(`✅ Email: ${currentEmail} → ${newEmail}`);
    console.log(`✅ Password: Updated`);
    console.log(`📝 Admin: ${admin.first_name} ${admin.last_name}`);
    console.log("");
    console.log("🚨 Important: Use the NEW credentials to login next time!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

// Get arguments from command line
const currentEmail = process.argv[2];
const newEmail = process.argv[3];
const newPassword = process.argv[4];

updateAdmin(currentEmail, newEmail, newPassword);
