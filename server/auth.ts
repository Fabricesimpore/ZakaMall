import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage as _storage } from "./storage";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
    name: "connect.sid",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax", // Allow same-site requests
    },
  });
}

// Setup authentication middleware
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionUser = (req as any).session?.user;

  if (sessionUser && sessionUser.isAuthenticated) {
    (req as any).user = sessionUser;
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};

// Login schemas
const _emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const _phoneLoginSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  password: z.string().min(6),
});

// Register schema
const _registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["customer", "vendor", "driver"]).default("customer"),
});

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helper function to verify passwords
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Helper function to create user session
export function createUserSession(req: any, user: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const userSession = {
      claims: {
        sub: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };

    (req as any).user = userSession;
    if (req.session) {
      (req.session as any).user = userSession;
      // Force session save
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          reject(err);
        } else {
          console.log("Session saved successfully for user:", user.email);
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}
