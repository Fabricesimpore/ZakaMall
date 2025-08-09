/**
 * Safe money handling utilities for financial calculations
 * All amounts are stored as integers (in cents/smallest currency unit)
 * to avoid floating point precision issues
 */

import Decimal from "decimal.js";

// Configure Decimal for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 9,
});

/**
 * Convert a money amount to the smallest currency unit (cents)
 * @param amount - Amount in major currency units (e.g., 1234.56 CFA)
 * @returns Amount in minor currency units (e.g., 123456 centimes)
 */
export function toMinorUnit(amount: number | string | undefined | null): number {
  if (amount === undefined || amount === null || amount === "") {
    return 0;
  }

  try {
    const decimal = new Decimal(amount);
    if (decimal.isNaN() || !decimal.isFinite()) {
      console.error(`Invalid amount for conversion: ${amount}`);
      return 0;
    }
    // Multiply by 100 and round to avoid floating point issues
    return decimal.mul(100).round().toNumber();
  } catch (error) {
    console.error(`Error converting amount to minor unit: ${amount}`, error);
    return 0;
  }
}

/**
 * Convert from smallest currency unit back to major units
 * @param minorAmount - Amount in minor currency units (e.g., 123456 centimes)
 * @returns Amount in major currency units (e.g., 1234.56 CFA)
 */
export function toMajorUnit(minorAmount: number | string | undefined | null): number {
  if (minorAmount === undefined || minorAmount === null || minorAmount === "") {
    return 0;
  }

  try {
    const decimal = new Decimal(minorAmount);
    if (decimal.isNaN() || !decimal.isFinite()) {
      console.error(`Invalid minor amount for conversion: ${minorAmount}`);
      return 0;
    }
    // Divide by 100 to get major units
    return decimal.div(100).toNumber();
  } catch (error) {
    console.error(`Error converting minor unit to major: ${minorAmount}`, error);
    return 0;
  }
}

/**
 * Format money for display
 * @param amount - Amount in major currency units
 * @param currency - Currency code (default: XOF for CFA)
 * @returns Formatted string (e.g., "1,234.56 CFA")
 */
export function formatMoney(
  amount: number | string | undefined | null,
  currency: string = "XOF"
): string {
  if (amount === undefined || amount === null || amount === "") {
    return "0 CFA";
  }

  try {
    const decimal = new Decimal(amount);
    if (decimal.isNaN() || !decimal.isFinite()) {
      return "0 CFA";
    }

    const formatted = decimal.toFixed(2);
    const parts = formatted.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (currency === "XOF") {
      return `${parts.join(".")} CFA`;
    }
    return `${parts.join(".")} ${currency}`;
  } catch (error) {
    console.error(`Error formatting money: ${amount}`, error);
    return "0 CFA";
  }
}

/**
 * Calculate commission amount
 * @param amount - Base amount
 * @param rate - Commission rate (e.g., 0.05 for 5%)
 * @returns Commission amount
 */
export function calculateCommission(amount: number | string, rate: number | string): number {
  try {
    const amountDecimal = new Decimal(amount);
    const rateDecimal = new Decimal(rate);

    if (amountDecimal.isNaN() || rateDecimal.isNaN()) {
      console.error(`Invalid commission calculation: amount=${amount}, rate=${rate}`);
      return 0;
    }

    return amountDecimal.mul(rateDecimal).toNumber();
  } catch (error) {
    console.error(`Error calculating commission: amount=${amount}, rate=${rate}`, error);
    return 0;
  }
}

/**
 * Add multiple amounts safely
 * @param amounts - Array of amounts to sum
 * @returns Total sum
 */
export function sumAmounts(amounts: (number | string | undefined | null)[]): number {
  try {
    return amounts.reduce((sum: number, amount: number | string | undefined | null) => {
      if (amount === undefined || amount === null || amount === "") {
        return sum;
      }

      const decimal = new Decimal(amount);
      if (decimal.isNaN() || !decimal.isFinite()) {
        console.warn(`Skipping invalid amount in sum: ${amount}`);
        return sum;
      }

      return new Decimal(sum).add(decimal).toNumber();
    }, 0);
  } catch (error) {
    console.error("Error summing amounts:", error);
    return 0;
  }
}

/**
 * Validate if a value is a valid money amount
 * @param amount - Value to validate
 * @returns True if valid money amount
 */
export function isValidMoneyAmount(amount: any): boolean {
  if (amount === undefined || amount === null || amount === "") {
    return false;
  }

  try {
    const decimal = new Decimal(amount);
    return !decimal.isNaN() && decimal.isFinite() && decimal.gte(0);
  } catch {
    return false;
  }
}

/**
 * Parse money amount from user input
 * @param input - User input string
 * @returns Parsed amount or null if invalid
 */
export function parseMoneyInput(input: string): number | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  // Remove common formatting characters
  const cleaned = input
    .replace(/[,\s]/g, "") // Remove commas and spaces
    .replace(/CFA/gi, "") // Remove CFA suffix
    .replace(/XOF/gi, "") // Remove XOF suffix
    .trim();

  if (!cleaned) {
    return null;
  }

  try {
    const decimal = new Decimal(cleaned);
    if (decimal.isNaN() || !decimal.isFinite() || decimal.lt(0)) {
      return null;
    }
    return decimal.toNumber();
  } catch {
    return null;
  }
}

/**
 * Calculate percentage
 * @param value - Value to calculate percentage of
 * @param percentage - Percentage (e.g., 15 for 15%)
 * @returns Calculated percentage value
 */
export function calculatePercentage(value: number | string, percentage: number | string): number {
  try {
    const valueDecimal = new Decimal(value);
    const percentDecimal = new Decimal(percentage);

    if (valueDecimal.isNaN() || percentDecimal.isNaN()) {
      console.error(`Invalid percentage calculation: value=${value}, percentage=${percentage}`);
      return 0;
    }

    return valueDecimal.mul(percentDecimal).div(100).toNumber();
  } catch (error) {
    console.error(`Error calculating percentage: value=${value}, percentage=${percentage}`, error);
    return 0;
  }
}

/**
 * Round money amount to 2 decimal places
 * @param amount - Amount to round
 * @returns Rounded amount
 */
export function roundMoney(amount: number | string): number {
  try {
    const decimal = new Decimal(amount);
    if (decimal.isNaN() || !decimal.isFinite()) {
      console.error(`Invalid amount for rounding: ${amount}`);
      return 0;
    }
    return decimal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  } catch (error) {
    console.error(`Error rounding money: ${amount}`, error);
    return 0;
  }
}
