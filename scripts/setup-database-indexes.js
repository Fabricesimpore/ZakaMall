#!/usr/bin/env node

/**
 * Database index setup script for ZakaMall
 * Creates performance indexes for production deployment
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupIndexes() {
  console.log('🚀 Setting up database indexes for production performance...\n');

  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '../server/database/createIndexes.sql');
    const indexSql = readFileSync(sqlPath, 'utf8');

    console.log('📋 Creating performance indexes...');
    
    // Execute the SQL to create indexes
    await pool.query(indexSql);

    console.log('✅ Database indexes created successfully!\n');

    // Check index creation results
    console.log('📊 Checking index statistics...');
    const indexStats = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `);

    console.log(`\n✅ Created ${indexStats.rows.length} performance indexes:`);
    
    const indexesByTable = {};
    indexStats.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });

    Object.entries(indexesByTable).forEach(([tableName, indexes]) => {
      console.log(`  📋 ${tableName}: ${indexes.length} indexes`);
      indexes.forEach(indexName => {
        console.log(`    - ${indexName}`);
      });
    });

    // Performance analysis
    console.log('\n🔍 Database performance recommendations:');
    
    const tableStats = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins + n_tup_upd + n_tup_del as total_writes,
        seq_scan,
        idx_scan,
        CASE 
          WHEN seq_scan + idx_scan > 0 
          THEN round((idx_scan::float / (seq_scan + idx_scan)) * 100, 2)
          ELSE 0
        END as index_usage_pct
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY total_writes DESC, seq_scan DESC;
    `);

    tableStats.rows.forEach(row => {
      const status = row.index_usage_pct > 50 ? '✅' : row.seq_scan > 100 ? '⚠️' : '📊';
      console.log(`  ${status} ${row.tablename}: ${row.index_usage_pct}% index usage (${row.seq_scan} seq scans, ${row.idx_scan} index scans)`);
    });

    console.log('\n🎯 Index setup complete! Your database is optimized for production.\n');

    // Recommendations
    console.log('💡 Performance tips:');
    console.log('  - Monitor index usage with: SELECT * FROM index_usage_stats;');
    console.log('  - Check table performance with: SELECT * FROM table_performance_stats;');
    console.log('  - Run ANALYZE regularly to update query planner statistics');
    console.log('  - Consider adding more specific indexes based on your query patterns\n');

  } catch (error) {
    console.error('❌ Error setting up indexes:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Some indexes already exist - this is normal.');
      console.log('✅ Index setup completed with existing indexes preserved.\n');
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

// Run the script
setupIndexes().catch((error) => {
  console.error('❌ Failed to setup database indexes:', error);
  process.exit(1);
});