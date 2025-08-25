import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Diagnose what's blocking a user deletion
 */
export async function diagnoseDeletion(userId: string): Promise<any> {
  console.log("🔍 Running deletion diagnostics for:", userId);

  const diagnostics: any = {
    userId,
    userExists: false,
    blockingTables: [],
    foreignKeys: [],
    errors: [],
  };

  try {
    // Check if user exists
    const userCheck = await db.execute(sql`
      SELECT id, email, role FROM users WHERE id = ${userId}
    `);

    if (userCheck.rows.length > 0) {
      diagnostics.userExists = true;
      diagnostics.user = userCheck.rows[0];
    }

    // Get all foreign key constraints
    try {
      const constraints = await db.execute(sql`
        SELECT 
          tc.table_name,
          kcu.column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'users'
          AND ccu.column_name = 'id'
      `);

      diagnostics.foreignKeys = constraints.rows;

      // Check each constraint for blocking data
      for (const constraint of constraints.rows) {
        try {
          const query = sql.raw(`
            SELECT COUNT(*) as count 
            FROM ${constraint.table_name} 
            WHERE ${constraint.column_name} = '${userId}'
          `);

          const result = await db.execute(query);
          const count = Number(result.rows[0]?.count || 0);

          if (count > 0) {
            diagnostics.blockingTables.push({
              table: constraint.table_name,
              column: constraint.column_name,
              count: count,
              constraint: constraint.constraint_name,
            });
          }
        } catch (error: any) {
          diagnostics.errors.push({
            table: constraint.table_name,
            error: error.message,
          });
        }
      }
    } catch (error: any) {
      diagnostics.errors.push({
        phase: "foreign_keys",
        error: error.message,
      });
    }

    // Try to get vendor info if exists
    try {
      const vendorCheck = await db.execute(sql`
        SELECT id FROM vendors WHERE user_id = ${userId}
      `);

      if (vendorCheck.rows.length > 0) {
        diagnostics.isVendor = true;
        diagnostics.vendorId = vendorCheck.rows[0].id;

        // Check for vendor products
        const productsCheck = await db.execute(sql`
          SELECT COUNT(*) as count FROM products WHERE vendor_id = ${vendorCheck.rows[0].id}
        `);

        diagnostics.vendorProductCount = Number(productsCheck.rows[0]?.count || 0);
      }
    } catch {
      // Vendor table might not exist
    }
  } catch (error: any) {
    diagnostics.mainError = error.message;
  }

  return diagnostics;
}
