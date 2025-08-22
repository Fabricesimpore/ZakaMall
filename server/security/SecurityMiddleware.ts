import { Request, Response, NextFunction } from "express";
import { SecurityService } from "./SecurityService";
import { storage } from "../storage";

// Defensive security logging helper
async function safeLogSecurityEvent(eventData: any) {
  try {
    await securityService.logSecurityEvent(eventData);
  } catch (error: any) {
    console.warn("⚠️ Security logging failed (tables may not exist yet):", error?.message || error);
  }
}

// Initialize security service with configuration
const securityConfig = {
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // per window
    skipSuccessfulRequests: false,
  },
  fraudDetection: {
    enabled: true,
    riskThreshold: 0.6,
    autoBlock: true,
  },
  blacklist: {
    enabled: true,
    autoExpiry: 24, // hours
  },
};

export const securityService = new SecurityService(securityConfig);

// Global security middleware
export const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = getClientIP(req);
    const userAgent = req.headers["user-agent"] || "";

    // Check if IP is blacklisted
    const blacklistCheck = await securityService.checkBlacklist(ip);
    if (blacklistCheck.isBlacklisted) {
      await safeLogSecurityEvent({
        incidentType: "blacklist_access_attempt",
        severity: "high",
        ipAddress: ip,
        userAgent,
        requestPath: req.path,
        requestMethod: req.method,
        description: `Blacklisted IP attempted access: ${blacklistCheck.reason}`,
        metadata: { blacklistReason: blacklistCheck.reason },
      });

      return res.status(403).json({
        error: "Access Denied",
        message: "Your IP address has been blocked due to security concerns.",
      });
    }

    // Add security context to request
    (req as any).security = {
      ip,
      userAgent,
      deviceFingerprint: SecurityService.generateDeviceFingerprint(req),
      geoLocation: await SecurityService.getGeoLocation(ip),
    };

    next();
  } catch (error) {
    console.error("Security middleware error:", error);
    next(); // Continue on error to not break the app
  }
};

// Rate limiting for different endpoints
export const globalRateLimit = securityService.rateLimiter("global");
export const authRateLimit = securityService.rateLimiter("auth");
export const apiRateLimit = securityService.rateLimiter("api");
export const orderRateLimit = securityService.rateLimiter("orders");

// Fraud detection middleware for orders
export const fraudDetectionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.claims?.sub;
    if (!userId) {
      return next(); // Skip fraud detection for anonymous users
    }

    const orderData = req.body;
    const security = (req as any).security;

    const fraudResult = await securityService.detectOrderFraud(orderData, {
      userId,
      ipAddress: security.ip,
      deviceFingerprint: security.deviceFingerprint,
      geoLocation: security.geoLocation,
    });

    // Add fraud result to request for downstream processing
    (req as any).fraudAnalysis = fraudResult;

    // Block high-risk orders
    if (fraudResult.status === "blocked") {
      await safeLogSecurityEvent({
        incidentType: "fraudulent_order",
        severity: "critical",
        userId,
        ipAddress: security.ip,
        userAgent: security.userAgent,
        requestPath: req.path,
        description: `High-risk order blocked: Risk score ${fraudResult.riskScore}`,
        metadata: {
          orderId: orderData.id,
          riskScore: fraudResult.riskScore,
          riskFactors: fraudResult.riskFactors,
          rules: fraudResult.rules,
        },
      });

      return res.status(403).json({
        error: "Order Blocked",
        message: "This order has been flagged for security review. Please contact support.",
        fraudAnalysis: {
          status: fraudResult.status,
          riskScore: fraudResult.riskScore,
          recommendation: fraudResult.recommendation,
        },
      });
    }

    // Flag for manual review
    if (fraudResult.status === "manual_review") {
      await safeLogSecurityEvent({
        incidentType: "fraudulent_order",
        severity: "medium",
        userId,
        ipAddress: security.ip,
        userAgent: security.userAgent,
        requestPath: req.path,
        description: `Order flagged for manual review: Risk score ${fraudResult.riskScore}`,
        metadata: {
          orderId: orderData.id,
          riskScore: fraudResult.riskScore,
          riskFactors: fraudResult.riskFactors,
          rules: fraudResult.rules,
        },
      });
    }

    next();
  } catch (error) {
    console.error("Fraud detection middleware error:", error);
    next(); // Continue on error
  }
};

// Suspicious activity detection
export const suspiciousActivityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.claims?.sub;
    const security = (req as any).security;

    // Detect suspicious patterns
    let riskScore = 0;
    const anomalyFactors: string[] = [];

    // Check for suspicious request patterns
    if (req.method === "POST" && req.body) {
      // Large request body
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > 100000) {
        // 100KB
        riskScore += 0.3;
        anomalyFactors.push("LARGE_REQUEST_BODY");
      }

      // SQL injection patterns
      const bodyString = JSON.stringify(req.body).toLowerCase();
      const sqlPatterns = [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+set/i,
        /script\s*>/i,
        /<\s*script/i,
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(bodyString)) {
          riskScore += 0.8;
          anomalyFactors.push("SQL_INJECTION_ATTEMPT");
          break;
        }
      }
    }

    // Check for unusual request times
    const hour = new Date().getHours();
    if (hour < 4 || hour > 23) {
      riskScore += 0.2;
      anomalyFactors.push("UNUSUAL_HOUR");
    }

    // Check user agent patterns
    const userAgent = security.userAgent.toLowerCase();
    const suspiciousAgents = ["bot", "crawler", "spider", "scraper", "curl", "wget"];
    if (suspiciousAgents.some((agent) => userAgent.includes(agent))) {
      riskScore += 0.4;
      anomalyFactors.push("SUSPICIOUS_USER_AGENT");
    }

    // Log suspicious activity if risk score is high enough
    if (riskScore >= 0.4) {
      await storage.logSuspiciousActivity({
        userId,
        activityType: getActivityType(req.path),
        riskScore,
        anomalyFactors,
        ipAddress: security.ip,
        userAgent: security.userAgent,
        geoLocation: security.geoLocation,
        sessionData: {
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
        },
      });

      // Block if risk is very high
      if (riskScore >= 0.8) {
        await safeLogSecurityEvent({
          incidentType: getIncidentType(anomalyFactors),
          severity: "high",
          userId,
          ipAddress: security.ip,
          userAgent: security.userAgent,
          requestPath: req.path,
          requestMethod: req.method,
          description: `High-risk activity blocked: ${anomalyFactors.join(", ")}`,
          metadata: { riskScore, anomalyFactors },
        });

        return res.status(403).json({
          error: "Suspicious Activity Detected",
          message: "This request has been blocked due to suspicious activity patterns.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Suspicious activity middleware error:", error);
    next();
  }
};

// Helper functions
function getClientIP(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.headers["x-real-ip"] as string) ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "0.0.0.0"
  );
}

function getActivityType(path: string): string {
  if (path.includes("/login")) return "login";
  if (path.includes("/orders")) return "order_creation";
  if (path.includes("/payment")) return "payment_attempt";
  if (path.includes("/profile")) return "profile_update";
  if (path.includes("/reviews")) return "review_submission";
  if (path.includes("/messages")) return "message_sent";
  if (path.includes("/products")) return "product_listing";
  return "unknown";
}

function getIncidentType(factors: string[]): string {
  if (factors.includes("SQL_INJECTION_ATTEMPT")) return "sql_injection";
  if (factors.includes("SUSPICIOUS_USER_AGENT")) return "suspicious_login";
  if (factors.includes("LARGE_REQUEST_BODY")) return "malicious_upload";
  return "suspicious_activity";
}

// Specific endpoint protections
export const loginProtection = [authRateLimit, suspiciousActivityMiddleware];

export const orderProtection = [orderRateLimit, fraudDetectionMiddleware];

export const apiProtection = [apiRateLimit, suspiciousActivityMiddleware];

export const adminProtection = [
  globalRateLimit,
  suspiciousActivityMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      await safeLogSecurityEvent({
        incidentType: "unauthorized_admin_access",
        severity: "high",
        userId,
        ipAddress: (req as any).security?.ip,
        requestPath: req.path,
        description: "Non-admin user attempted to access admin endpoint",
      });

      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  },
];

// Export already handled above
