#!/usr/bin/env node

/**
 * Analyze what's preventing user deletion
 * Finds all foreign key references to a specific user
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function analyzeUserConstraints(userId) {
  if (!userId) {
    console.error("❌ Usage: node analyze-user-constraints.cjs <userId>");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  
  try {
    console.log(`🔍 Analyzing constraints for user: ${userId}`);
    
    // First check if user exists
    const { rows: userCheck } = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userCheck.length === 0) {
      console.log("❌ User not found!");
      return;
    }
    
    console.log(`📋 User found: ${userCheck[0].email}`);
    
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
    
    console.log(`\n🔗 Found ${constraints.length} foreign key references to users table:`);
    
    let totalReferences = 0;
    
    for (const constraint of constraints) {
      const tableName = constraint.table_name;
      const columnName = constraint.column_name;
      
      try {
        // Check if this table has any records referencing our user
        const { rows: references } = await pool.query(`
          SELECT COUNT(*) as count FROM ${tableName} WHERE ${columnName} = $1
        `, [userId]);
        
        const count = parseInt(references[0].count);
        totalReferences += count;
        
        if (count > 0) {
          console.log(`  ❌ ${tableName}.${columnName}: ${count} references`);
          
          // Show some example records (first 3)
          const { rows: examples } = await pool.query(`
            SELECT * FROM ${tableName} WHERE ${columnName} = $1 LIMIT 3
          `, [userId]);
          
          examples.forEach((example, index) => {
            const keys = Object.keys(example).slice(0, 3); // Show first 3 columns
            const preview = keys.map(key => `${key}:${example[key]}`).join(', ');
            console.log(`    • Record ${index + 1}: ${preview}...`);
          });
        } else {
          console.log(`  ✅ ${tableName}.${columnName}: 0 references`);
        }
        
      } catch (error) {
        console.log(`  ⚠️ ${tableName}.${columnName}: Error checking - ${error.message.slice(0, 50)}`);
      }
    }
    
    console.log(`\n📊 Total blocking references: ${totalReferences}`);
    
    if (totalReferences > 0) {
      console.log("\n💡 These references must be cleaned up before user deletion can succeed.");
      console.log("💡 Use the force-user-deletion.cjs script to clean them up systematically.");
    } else {
      console.log("\n✅ No foreign key references found - user should be deletable!");
      console.log("💡 The deletion failure might be due to table/column name mismatches.");
    }
    
  } catch (error) {
    console.error("❌ Analysis failed:", error);
  } finally {
    await pool.end();
  }
}

const userId = process.argv[2];
analyzeUserConstraints(userId).catch(console.error);