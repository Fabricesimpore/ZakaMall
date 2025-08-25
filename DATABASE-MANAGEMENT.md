# Database Management System

## Overview

This document outlines the comprehensive database management system implemented to prevent missing tables and ensure database consistency across all environments.

## 🚀 Features

### 1. **Schema Validation**
- Automated validation of all required tables and columns
- Detection of missing database objects
- Configurable required vs optional tables
- Detailed error reporting

### 2. **Migration Management**
- Automatic migration detection and application
- Integration with Drizzle migrations
- Safe migration rollback capabilities
- Environment-specific migration handling

### 3. **Health Checks**
- Comprehensive startup health checks
- Runtime database connectivity monitoring
- Auto-healing capabilities for common issues
- Detailed health reporting endpoints

### 4. **Auto-Fix Capabilities**
- Automatic table creation for missing tables
- Schema synchronization between environments
- Safe production fixes with rollback options
- Dry-run mode for testing fixes

## 📋 How It Prevents Missing Tables

### 1. **Startup Validation**
```typescript
// Server automatically validates schema on startup
const healthCheck = await runStartupHealthCheck(true); // Auto-fix enabled
```

### 2. **Schema Definition**
All required tables are defined in `server/database/schema-validator.ts`:
```typescript
export const EXPECTED_SCHEMA: TableDefinition[] = [
  {
    name: "users",
    required: true,
    columns: [/* ... */]
  },
  // ... more tables
];
```

### 3. **Production Safety**
- In production, critical errors abort server startup
- Missing required tables trigger automatic creation
- Optional tables generate warnings but don't block startup
- All fixes are logged for audit trails

### 4. **Development Flexibility**
- Development mode continues with warnings
- Auto-fix attempts to resolve issues
- Detailed error messages help debugging

## 🛠️ CLI Tools

### Database Manager CLI
```bash
# Validate schema
npm run db:validate
npm run db:validate:prod

# Run migrations
npm run db:migrate
npm run db:migrate:prod

# Health check
npm run db:health-check
npm run db:health-check:prod

# Auto-fix issues
npm run db:auto-fix
npm run db:auto-fix:prod
```

### Direct Script Usage
```bash
node scripts/database-manager.js validate
node scripts/database-manager.js migrate
node scripts/database-manager.js health-check
node scripts/database-manager.js auto-fix
```

## 🔍 Health Check Endpoints

### Basic Health Check
```
GET /health
GET /api/health
```

### Detailed Health Check
```
GET /api/health/detailed
```
Returns comprehensive database status including:
- Connection status
- Schema validation results
- Migration status
- Detected issues and fixes applied

## 🔧 Configuration

### Required Tables
Edit `server/database/schema-validator.ts` to add/remove required tables:

```typescript
{
  name: "your_new_table",
  required: true, // Set to false for optional tables
  columns: [
    { name: "id", type: "varchar", nullable: false, hasDefault: true },
    { name: "user_id", type: "varchar", nullable: false },
    // ... more columns
  ],
}
```

### Environment Variables
```bash
# Database connection
DATABASE_URL=postgresql://...

# Environment mode affects behavior
NODE_ENV=production  # Strict mode - aborts on critical errors
NODE_ENV=development # Lenient mode - warns but continues
```

## 📊 Monitoring and Alerts

### Health Check Monitoring
```bash
# Check if service is healthy
curl -f http://localhost:3000/health

# Get detailed status
curl http://localhost:3000/api/health/detailed
```

### Log Monitoring
Look for these log patterns:
```
✅ Database schema validation passed
⚠️ Optional table 'rate_limit_violations' is missing  
❌ Required table 'users' is missing
🔧 Auto-fixing missing tables...
```

## 🚨 Error Scenarios and Resolutions

### Missing Required Table
**Error**: `❌ Required table 'users' is missing`
**Resolution**: 
1. Auto-fix enabled: Table created automatically
2. Manual fix: Run `npm run db:auto-fix`

### Missing Optional Table  
**Error**: `⚠️ Optional table 'rate_limit_violations' is missing`
**Resolution**:
1. Safe to ignore if feature not used
2. Create table: Run `npm run db:auto-fix`

### Migration Failure
**Error**: `❌ Failed to apply pending migrations`  
**Resolution**:
1. Check migration files in `/migrations`
2. Run migrations manually: `npm run db:migrate`
3. Check database permissions

### Connection Failure
**Error**: `❌ Database connection failed`
**Resolution**:
1. Verify DATABASE_URL is correct
2. Check database server is running
3. Verify network connectivity

## 🔄 Best Practices

### 1. **Before Deployment**
```bash
# Always validate before deploying
npm run db:health-check:prod

# Apply any pending migrations
npm run db:migrate:prod
```

### 2. **After Schema Changes**
```bash
# Generate new migrations
npx drizzle-kit generate

# Test in development
npm run db:migrate

# Validate everything works
npm run db:validate
```

### 3. **Production Deployments**
```bash
# Run health check as part of CI/CD
npm run db:health-check:prod || exit 1

# The server will automatically handle missing tables
npm start  # Includes health check
```

### 4. **Monitoring**
- Set up alerts on health check endpoints
- Monitor logs for database warnings
- Regular database backups before schema changes

## 🔐 Security Considerations

1. **Database Permissions**: Ensure application has CREATE TABLE permissions
2. **Auto-Fix Limits**: Auto-fix only creates tables, never drops data
3. **Audit Logging**: All schema changes are logged
4. **Rollback Plans**: Keep migration rollback scripts ready
5. **Backup Strategy**: Always backup before major changes

## 🎯 Next Steps

To further enhance the system:

1. **Schema Versioning**: Track schema versions across deployments
2. **Migration Rollbacks**: Implement automatic rollback on failure
3. **Real-time Monitoring**: Add metrics for database health
4. **Multi-environment Sync**: Tools to sync schema across environments
5. **Performance Monitoring**: Track query performance changes

## 📞 Support

If you encounter issues:
1. Check the logs for detailed error messages
2. Run `npm run db:health-check` for diagnosis
3. Use `npm run db:auto-fix` for common issues
4. Review this documentation for specific error scenarios