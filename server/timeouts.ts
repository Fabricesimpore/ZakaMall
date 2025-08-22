import type { Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";

export function withRequestTimeout(ms = 15000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.error("REQUEST_TIMEOUT", {
          path: req.originalUrl || req.url,
          method: req.method,
          timeoutMs: ms,
        });
        res.status(504).json({
          message: "Gateway Timeout",
          path: req.originalUrl || req.url,
          timeout: ms,
        });
      }
    }, ms);

    res.on("finish", () => {
      clearTimeout(timer);
      const duration = Date.now() - started;
      if (duration > ms - 1000) {
        console.warn("SLOW_REQUEST", {
          path: req.originalUrl,
          duration,
          status: res.statusCode,
        });
      }
    });

    next();
  };
}

export async function withDbStatementTimeout<T>(
  db: any,
  fn: () => Promise<T>,
  ms = 8000
): Promise<T> {
  try {
    await db.execute(sql`SET LOCAL statement_timeout = ${ms}`);
    return await fn();
  } catch (error) {
    console.error("DB_STATEMENT_TIMEOUT", { timeoutMs: ms, error: error?.message });
    throw error;
  }
}
