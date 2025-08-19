/**
 * Startup migrations script
 * Runs essential database migrations on application startup
 */

const { spawn } = require('child_process');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env }
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully: ${command}`);
        resolve();
      } else {
        console.error(`❌ Command failed with code ${code}: ${command}`);
        reject(new Error(`Command failed: ${command}`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ Error running command: ${command}`, error);
      reject(error);
    });
  });
}

async function runStartupMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Run the shop_name column migration
    console.log('📝 Running shop_name column migration...');
    await runCommand('node', ['scripts/add-shop-name-column.js']);
    
    console.log('🎉 All startup migrations completed successfully!');
  } catch (error) {
    console.error('💥 Startup migrations failed:', error);
    // Don't exit process - let the app start even if migrations fail
    console.log('⚠️  App will continue to start despite migration failures');
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runStartupMigrations();
}

module.exports = { runStartupMigrations };