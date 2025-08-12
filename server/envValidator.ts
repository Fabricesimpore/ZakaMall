/**
 * Environment variable validation for production readiness
 */

interface EnvConfig {
  required: string[];
  optional: string[];
  production: string[];
}

const envConfig: EnvConfig = {
  // Always required
  required: ["DATABASE_URL", "SESSION_SECRET"],
  // Optional but recommended
  optional: [
    "EMAIL_SERVICE",
    "EMAIL_USER",
    "EMAIL_PASS",
    "EMAIL_FROM",
    "SMS_PROVIDER",
    "DEFAULT_OBJECT_STORAGE_BUCKET_ID",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "PORT",
    "BASE_URL",
  ],
  // Required in production
  production: [
    "SESSION_SECRET", // Must not be default
    "EMAIL_USER",
    "EMAIL_PASS",
    "BASE_URL",
  ],
};

export function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // Check required variables
  for (const varName of envConfig.required) {
    if (!process.env[varName]) {
      errors.push(`❌ Missing required environment variable: ${varName}`);
    }
  }

  // Check production-specific requirements
  if (isProduction) {
    for (const varName of envConfig.production) {
      if (!process.env[varName]) {
        errors.push(`❌ Missing production-required variable: ${varName}`);
      }
    }

    // Validate SESSION_SECRET is not default
    if (
      process.env.SESSION_SECRET === "development-secret-change-in-production" ||
      (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32)
    ) {
      errors.push(
        "❌ SESSION_SECRET must be at least 32 characters and not the default value in production"
      );
    }

    // Validate database URL is not local
    if (
      process.env.DATABASE_URL?.includes("localhost") ||
      process.env.DATABASE_URL?.includes("127.0.0.1")
    ) {
      warnings.push("⚠️  DATABASE_URL points to localhost in production mode");
    }
  }

  // Check optional but recommended variables
  for (const varName of envConfig.optional) {
    if (!process.env[varName]) {
      warnings.push(`⚠️  Optional variable not set: ${varName}`);
    }
  }

  // Payment provider warnings
  const hasOrangeMoney = !!(
    process.env.ORANGE_MONEY_MERCHANT_CODE && process.env.ORANGE_MONEY_API_KEY
  );
  const hasMoovMoney = !!(
    process.env.MOOV_MONEY_MERCHANT_ID &&
    process.env.MOOV_MONEY_API_KEY &&
    process.env.MOOV_MONEY_API_SECRET
  );

  if (!hasOrangeMoney && !hasMoovMoney) {
    warnings.push("⚠️  No payment providers configured. Payments will run in mock mode.");
  }

  // Email configuration warning
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    warnings.push(
      "⚠️  Email service not configured. Email notifications will be logged to console."
    );
  }

  // SMS configuration warning
  if (process.env.SMS_PROVIDER === "console" || !process.env.SMS_PROVIDER) {
    warnings.push("⚠️  SMS service not configured. SMS messages will be logged to console.");
  }

  // Print validation results
  console.log("\n" + "=".repeat(60));
  console.log("🔍 ENVIRONMENT VALIDATION");
  console.log("=".repeat(60));

  if (errors.length > 0) {
    console.error("\n❌ ERRORS FOUND:");
    errors.forEach((error) => console.error(error));

    if (isProduction) {
      console.error("\n🛑 Cannot start in production mode with configuration errors!");
      console.error("Please fix the errors above and restart the application.\n");
      process.exit(1);
    } else {
      console.warn("\n⚠️  Running in development mode with configuration errors.");
      console.warn("These errors would prevent production deployment.\n");
    }
  }

  if (warnings.length > 0) {
    console.warn("\n⚠️  WARNINGS:");
    warnings.forEach((warning) => console.warn(warning));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("\n✅ All environment variables properly configured!");
  }

  // Print current configuration summary
  console.log("\n📋 CONFIGURATION SUMMARY:");
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Database: ${process.env.DATABASE_URL ? "✅ Configured" : "❌ Not configured"}`);
  console.log(`   Session Security: ${process.env.SESSION_SECRET ? "✅ Set" : "❌ Not set"}`);
  console.log(`   Email Service: ${process.env.EMAIL_USER ? "✅ Configured" : "⚠️  Mock mode"}`);
  console.log(
    `   SMS Service: ${process.env.SMS_PROVIDER !== "console" ? "✅ Configured" : "⚠️  Console mode"}`
  );
  console.log(`   Orange Money: ${hasOrangeMoney ? "✅ Configured" : "⚠️  Mock mode"}`);
  console.log(`   Moov Money: ${hasMoovMoney ? "✅ Configured" : "⚠️  Mock mode"}`);

  // Cloudinary configuration check
  const hasCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  console.log(`   Cloudinary: ${hasCloudinary ? "✅ Configured" : "⚠️  Not configured"}`);

  console.log(`   Port: ${process.env.PORT || "5000"}`);
  console.log("=".repeat(60) + "\n");
}

// Helper to safely get numeric env variables
export function getNumericEnv(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(
      `⚠️  Invalid numeric value for ${name}: "${value}", using default: ${defaultValue}`
    );
    return defaultValue;
  }

  return parsed;
}

// Helper to safely get boolean env variables
export function getBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;

  return value.toLowerCase() === "true" || value === "1";
}
