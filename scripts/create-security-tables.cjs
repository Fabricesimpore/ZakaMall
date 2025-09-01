#!/usr/bin/env node

/**
 * Create security tables for production
 * Ensures security_events and related tables exist before server starts
 */

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function createSecurityTables() {
  const pool = new Pool({ connectionString });

  try {
    console.log("🔐 Creating security tables...");

    // Create security_events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        incident_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        user_id VARCHAR(255),
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        request_path VARCHAR(500),
        request_method VARCHAR(10),
        request_headers JSONB,
        request_body JSONB,
        response_status INTEGER,
        geo_location JSONB,
        is_blocked BOOLEAN DEFAULT FALSE,
        is_resolved BOOLEAN DEFAULT FALSE,
        risk_score INTEGER DEFAULT 0,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by VARCHAR(255)
      );
    `);
    console.log("✅ security_events table created/verified");

    // Create rate_limit_violations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_violations (
        id SERIAL PRIMARY KEY,
        ip_address INET NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        violation_count INTEGER DEFAULT 1,
        window_start TIMESTAMP WITH TIME ZONE NOT NULL,
        last_violation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ rate_limit_violations table created/verified");

    // Create fraud_analysis table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fraud_analysis (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        order_id VARCHAR(255),
        risk_score INTEGER NOT NULL DEFAULT 0,
        risk_factors JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        flagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ fraud_analysis table created/verified");

    // Create suspicious_activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suspicious_activities (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        activity_type VARCHAR(100) NOT NULL,
        risk_level VARCHAR(20) DEFAULT 'MEDIUM',
        description TEXT,
        metadata JSONB,
        detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_investigated BOOLEAN DEFAULT FALSE,
        investigated_by VARCHAR(255),
        investigation_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ suspicious_activities table created/verified");

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON rate_limit_violations(ip_address);
      CREATE INDEX IF NOT EXISTS idx_fraud_analysis_user_id ON fraud_analysis(user_id);
      CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_id ON suspicious_activities(user_id);
    `);
    console.log("✅ Security table indexes created/verified");

    console.log("🎉 All security tables created successfully!");
  } catch (error) {
    console.error("❌ Failed to create security tables:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

createSecurityTables().catch(console.error);
