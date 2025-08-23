/**
 * Startup migrations script
 * Runs essential database migrations on application startup
 */

const { spawn } = require("child_process");

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(" ")}`);

    const childProcess = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env },
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully: ${command}`);
        resolve();
      } else {
        console.error(`❌ Command failed with code ${code}: ${command}`);
        reject(new Error(`Command failed: ${command}`));
      }
    });

    childProcess.on("error", (error) => {
      console.error(`❌ Error running command: ${command}`, error);
      reject(error);
    });
  });
}

async function runStartupMigrations() {
  console.log("🚀 Starting database migrations...");

  try {
    // Create security tables first (critical for admin access)
    console.log("🔐 Creating security tables...");
    await runCommand("node", ["scripts/create-security-tables.cjs"]);
    
    // Emergency vendor schema fix (critical for admin vendor management)
    console.log("🚨 Running emergency vendor schema fix...");
    await runCommand("node", ["scripts/emergency-vendor-schema-fix.cjs"]);
    
    // Run comprehensive vendors schema sync
    console.log("📝 Running vendors schema sync...");
    await runCommand("node", ["scripts/sync-vendors-schema.cjs"]);

    console.log("🎉 All startup migrations completed successfully!");
  } catch (error) {
    console.error("💥 Startup migrations failed:", error);
    // Don't exit process - let the app start even if migrations fail
    console.log("⚠️  App will continue to start despite migration failures");
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runStartupMigrations();
}

module.exports = { runStartupMigrations };
