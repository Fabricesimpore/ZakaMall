#!/usr/bin/env node

/**
 * Debug user deletion issues in production
 * Analyzes all users and their constraints to find deletion blockers
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function debugUserDeletion() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log("🔍 Analyzing user deletion constraints...\n");
    
    // Get all users
    const { rows: users } = await pool.query(`
      SELECT id, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📋 Found ${users.length} recent users:`);
    users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (${user.role}) - ID: ${user.id}`);
    });
    
    // Get all foreign key constraints that reference the users table
    const { rows: constraints } = await pool.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id'
      ORDER BY tc.table_name;
    `);
    
    console.log(`\n🔗 Found ${constraints.length} foreign key constraints:`);
    
    let globalBlockingTables = [];
    
    for (const constraint of constraints) {
      const tableName = constraint.table_name;
      const columnName = constraint.column_name;
      
      try {
        // Check total records in this table
        const { rows: totalRows } = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const totalCount = parseInt(totalRows[0].count);
        
        // Check records that reference any user
        const { rows: referencingRows } = await pool.query(`
          SELECT COUNT(DISTINCT ${columnName}) as unique_users, COUNT(*) as total_records 
          FROM ${tableName} 
          WHERE ${columnName} IS NOT NULL
        `);
        
        const uniqueUsers = parseInt(referencingRows[0].unique_users || 0);
        const totalRecords = parseInt(referencingRows[0].total_records || 0);
        
        if (totalRecords > 0) {
          globalBlockingTables.push({
            table: tableName,
            column: columnName,
            totalRecords,
            uniqueUsers
          });
          console.log(`  ❌ ${tableName}.${columnName}: ${totalRecords} records referencing ${uniqueUsers} users`);
        } else {
          console.log(`  ✅ ${tableName}.${columnName}: No blocking records`);
        }
        
      } catch (error) {
        console.log(`  ⚠️ ${tableName}.${columnName}: Error - ${error.message.slice(0, 50)}`);
      }
    }
    
    console.log(`\n📊 Tables blocking user deletion:`);
    if (globalBlockingTables.length === 0) {
      console.log("✅ No foreign key references found - users should be deletable!");
    } else {
      globalBlockingTables.forEach(table => {
        console.log(`  • ${table.table}: ${table.totalRecords} records`);
      });
    }
    
    // Test actual deletion attempt on a specific user (if provided)
    const testUserId = process.argv[2];
    if (testUserId) {
      console.log(`\n🧪 Testing deletion of user: ${testUserId}`);
      
      const { rows: userCheck } = await pool.query('SELECT email FROM users WHERE id = $1', [testUserId]);
      if (userCheck.length === 0) {
        console.log("❌ User not found!");
        return;
      }
      
      try {
        // Attempt deletion (in a transaction that we'll rollback)
        await pool.query('BEGIN');
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        console.log("✅ User deletion would succeed!");
        await pool.query('ROLLBACK');
      } catch (error) {
        await pool.query('ROLLBACK');
        console.log(`❌ User deletion failed: ${error.message}`);
        
        // Try to identify the specific constraint
        const constraintMatch = error.message.match(/violates foreign key constraint "([^"]+)"/);
        if (constraintMatch) {
          console.log(`🔍 Specific constraint: ${constraintMatch[1]}`);
        }
      }
    }
    
    // Check for table/column mismatches that might cause issues
    console.log(`\n🔍 Checking for potential schema mismatches...`);
    
    const potentialIssues = [
      { table: 'phone_verifications', expectedColumn: 'userId', actualColumn: 'phone' },
      { table: 'email_verifications', expectedColumn: 'userId', actualColumn: 'email' },
      { table: 'vendors', expectedColumn: 'user_id', actualColumn: 'store_name' }
    ];
    
    for (const issue of potentialIssues) {
      try {
        const { rows: columnCheck } = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [issue.table]);
        
        const hasExpected = columnCheck.some(col => col.column_name === issue.expectedColumn);
        const hasActual = columnCheck.some(col => col.column_name === issue.actualColumn);
        
        if (!hasExpected && hasActual) {
          console.log(`  ⚠️ ${issue.table}: Missing ${issue.expectedColumn}, has ${issue.actualColumn}`);
        } else if (hasExpected) {
          console.log(`  ✅ ${issue.table}: Has expected ${issue.expectedColumn} column`);
        }
      } catch (error) {
        console.log(`  ❓ ${issue.table}: Table may not exist`);
      }
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await pool.end();
  }
}

debugUserDeletion().catch(console.error);