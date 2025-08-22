/**
 * Vendor slug generation utilities
 * Creates unique, SEO-friendly slugs for vendor stores
 */

import { storage } from "../storage";

// Reserved slugs that cannot be used for vendor stores
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "store",
  "search",
  "checkout",
  "cart",
  "orders",
  "account",
  "profile",
  "settings",
  "help",
  "support",
  "contact",
  "about",
  "privacy",
  "terms",
  "legal",
  "security",
  "vendor",
  "vendors",
  "dashboard",
  "login",
  "register",
  "signup",
  "signin",
  "logout",
  "home",
  "marketplace",
  "categories",
  "products",
  "reviews",
  "notifications",
  "messages",
  "chat",
  "payment",
  "shipping",
  "delivery",
  "tracking",
  "invoice",
  "receipt",
  "refund",
  "return",
  "exchange",
  "warranty",
  "feedback",
  "report",
  "blog",
  "news",
  "events",
  "promotions",
  "deals",
  "offers",
  "coupons",
  "discounts",
  "affiliate",
  "partner",
  "reseller",
  "wholesale",
  "bulk",
  "enterprise",
]);

/**
 * Convert a store name into a URL-friendly slug
 */
export function slugifyStoreName(storeName: string): string {
  return storeName
    .toLowerCase()
    .trim()
    // Replace accented characters with base equivalents
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Replace non-alphanumeric chars with dashes
    .replace(/[^a-z0-9\s-]/g, "")
    // Replace multiple spaces/dashes with single dash
    .replace(/[\s-]+/g, "-")
    // Remove leading/trailing dashes
    .replace(/^-+|-+$/g, "")
    // Limit length
    .substring(0, 60);
}

/**
 * Generate a unique slug for a vendor store
 * Handles conflicts by appending -2, -3, etc.
 */
export async function generateUniqueStoreSlug(storeName: string): Promise<string> {
  const baseSlug = slugifyStoreName(storeName);
  
  // Check if base slug is reserved
  if (RESERVED_SLUGS.has(baseSlug)) {
    return generateUniqueStoreSlug(`${storeName} store`);
  }
  
  // Check if base slug is available
  const existing = await storage.getVendorBySlug(baseSlug);
  if (!existing) {
    return baseSlug;
  }
  
  // Try variations with numbers
  let counter = 2;
  while (counter <= 999) {
    const candidateSlug = `${baseSlug}-${counter}`;
    
    // Check if this variation is available
    const existingVariation = await storage.getVendorBySlug(candidateSlug);
    if (!existingVariation) {
      return candidateSlug;
    }
    
    counter++;
  }
  
  // If we still can't find a unique slug, add a random suffix
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Validate that a slug meets the requirements
 */
export function validateStoreSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 60) {
    return false;
  }
  
  // Must contain only lowercase letters, numbers, and dashes
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false;
  }
  
  // Cannot start or end with dash
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return false;
  }
  
  // Cannot be reserved
  if (RESERVED_SLUGS.has(slug)) {
    return false;
  }
  
  return true;
}

/**
 * Generate a suggested store name when the desired one is taken
 */
export function generateStoreNameSuggestions(storeName: string): string[] {
  const suggestions = [];
  const baseSlug = slugifyStoreName(storeName);
  
  suggestions.push(`${storeName} Store`);
  suggestions.push(`${storeName} Shop`);
  suggestions.push(`${storeName} Boutique`);
  
  // Add location-based suggestions for common business types
  if (baseSlug.includes("mobile") || baseSlug.includes("phone")) {
    suggestions.push(`${storeName} Plus`);
    suggestions.push(`${storeName} Pro`);
  }
  
  if (baseSlug.includes("fashion") || baseSlug.includes("clothing")) {
    suggestions.push(`${storeName} Collection`);
    suggestions.push(`${storeName} Style`);
  }
  
  if (baseSlug.includes("tech") || baseSlug.includes("electronics")) {
    suggestions.push(`${storeName} Hub`);
    suggestions.push(`${storeName} Zone`);
  }
  
  return suggestions.slice(0, 5); // Return max 5 suggestions
}