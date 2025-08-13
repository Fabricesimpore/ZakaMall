import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import crypto from "crypto";

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
  };
  fraudDetection: {
    enabled: boolean;
    riskThreshold: number;
    autoBlock: boolean;
  };
  blacklist: {
    enabled: boolean;
    autoExpiry: number; // hours
  };
}

export interface RiskFactors {
  velocityRisk: number;
  locationRisk: number;
  deviceRisk: number;
  behaviorRisk: number;
  accountRisk: number;
  paymentRisk: number;
}

export interface FraudDetectionResult {
  riskScore: number;
  status: "approved" | "flagged" | "blocked" | "manual_review";
  riskFactors: RiskFactors;
  rules: string[];
  recommendation: string;
}

export class SecurityService {
  private config: SecurityConfig;
  private ipRequestCounts: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  // Rate limiting middleware
  rateLimiter = (endpoint: string = "global") => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.rateLimiting) {
        return next();
      }

      const ip = this.getClientIP(req);
      const key = `${ip}:${endpoint}`;
      const now = Date.now();
      const windowMs = this.config.rateLimiting.windowMs;
      const maxRequests = this.config.rateLimiting.maxRequests;

      // Clean up old entries
      this.cleanupOldEntries(now, windowMs);

      // Get current request count for this IP/endpoint
      const current = this.ipRequestCounts.get(key);

      if (!current || now - current.windowStart > windowMs) {
        // New window
        this.ipRequestCounts.set(key, { count: 1, windowStart: now });
        return next();
      }

      if (current.count >= maxRequests) {
        // Rate limit exceeded
        await this.logSecurityEvent({
          incidentType: "rate_limit_exceeded",
          severity: "medium",
          ipAddress: ip,
          requestPath: req.path,
          requestMethod: req.method,
          description: `Rate limit exceeded for endpoint ${endpoint}`,
          metadata: { endpoint, requestCount: current.count, maxRequests },
        });

        // Log to rate limit violations table
        await this.logRateLimitViolation(ip, endpoint, current.count);

        return res.status(429).json({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((windowMs - (now - current.windowStart)) / 1000),
        });
      }

      // Increment count
      current.count++;
      this.ipRequestCounts.set(key, current);

      next();
    };
  };

  // Fraud detection for orders
  async detectOrderFraud(orderData: any, userContext: any): Promise<FraudDetectionResult> {
    const riskFactors: RiskFactors = {
      velocityRisk: await this.calculateVelocityRisk(userContext.userId, orderData),
      locationRisk: await this.calculateLocationRisk(userContext.ipAddress, userContext.userId),
      deviceRisk: await this.calculateDeviceRisk(userContext.deviceFingerprint, userContext.userId),
      behaviorRisk: await this.calculateBehaviorRisk(userContext.userId, orderData),
      accountRisk: await this.calculateAccountRisk(userContext.userId),
      paymentRisk: await this.calculatePaymentRisk(orderData.paymentMethod, userContext.userId),
    };

    const rules: string[] = [];
    let riskScore = 0;

    // Calculate overall risk score
    const weights = {
      velocity: 0.25,
      location: 0.15,
      device: 0.15,
      behavior: 0.2,
      account: 0.15,
      payment: 0.1,
    };

    riskScore =
      riskFactors.velocityRisk * weights.velocity +
      riskFactors.locationRisk * weights.location +
      riskFactors.deviceRisk * weights.device +
      riskFactors.behaviorRisk * weights.behavior +
      riskFactors.accountRisk * weights.account +
      riskFactors.paymentRisk * weights.payment;

    // Apply fraud rules
    if (riskFactors.velocityRisk > 0.8) {
      rules.push("HIGH_VELOCITY_PURCHASES");
      riskScore += 0.2;
    }

    if (riskFactors.locationRisk > 0.7) {
      rules.push("SUSPICIOUS_LOCATION");
      riskScore += 0.15;
    }

    if (riskFactors.accountRisk > 0.9) {
      rules.push("HIGH_RISK_ACCOUNT");
      riskScore += 0.25;
    }

    if (orderData.amount > 500000) {
      // High value order
      rules.push("HIGH_VALUE_ORDER");
      riskScore += 0.1;
    }

    // Determine status and recommendation
    let status: "approved" | "flagged" | "blocked" | "manual_review" = "approved";
    let recommendation = "Order appears legitimate, proceed with processing.";

    if (riskScore >= 0.8) {
      status = "blocked";
      recommendation = "High fraud risk detected. Block order and investigate.";
    } else if (riskScore >= 0.6) {
      status = "manual_review";
      recommendation = "Moderate fraud risk. Requires manual review before processing.";
    } else if (riskScore >= 0.4) {
      status = "flagged";
      recommendation =
        "Low-medium fraud risk. Monitor closely and consider additional verification.";
    }

    // Log fraud analysis
    await this.logFraudAnalysis({
      orderId: orderData.id,
      userId: userContext.userId,
      status,
      riskScore,
      riskFactors,
      rules,
      ipAddress: userContext.ipAddress,
      deviceFingerprint: userContext.deviceFingerprint,
      geoLocation: userContext.geoLocation,
    });

    return {
      riskScore,
      status,
      riskFactors,
      rules,
      recommendation,
    };
  }

  // Check if IP/user is blacklisted
  async checkBlacklist(
    ip: string,
    userId?: string,
    email?: string
  ): Promise<{ isBlacklisted: boolean; reason?: string }> {
    const blacklistChecks = [{ type: "ip_address", value: ip }];

    if (userId) {
      blacklistChecks.push({ type: "user_account", value: userId });
    }

    if (email) {
      const domain = email.split("@")[1];
      blacklistChecks.push({ type: "email_domain", value: domain });
    }

    for (const check of blacklistChecks) {
      const isBlacklisted = await storage.isBlacklisted(check.type, check.value);
      if (isBlacklisted.isBlacklisted) {
        return { isBlacklisted: true, reason: isBlacklisted.reason };
      }
    }

    return { isBlacklisted: false };
  }

  // Security event logging
  async logSecurityEvent(event: {
    incidentType: string;
    severity: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    requestPath?: string;
    requestMethod?: string;
    requestHeaders?: any;
    requestBody?: any;
    responseStatus?: number;
    geoLocation?: any;
    description?: string;
    metadata?: any;
  }) {
    return await storage.logSecurityEvent(event);
  }

  // Private helper methods
  private getClientIP(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.headers["x-real-ip"] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "0.0.0.0"
    );
  }

  private cleanupOldEntries(now: number, windowMs: number) {
    for (const [key, data] of this.ipRequestCounts.entries()) {
      if (now - data.windowStart > windowMs) {
        this.ipRequestCounts.delete(key);
      }
    }
  }

  private async logRateLimitViolation(ip: string, endpoint: string, attemptCount: number) {
    const windowEnd = new Date(Date.now() + this.config.rateLimiting.windowMs);
    return await storage.logRateLimitViolation({
      ipAddress: ip,
      endpoint,
      attemptCount,
      windowEnd,
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  private async logFraudAnalysis(data: any) {
    return await storage.logFraudAnalysis(data);
  }

  // Risk calculation methods
  private async calculateVelocityRisk(userId: string, orderData: any): Promise<number> {
    // Check recent order frequency and amounts
    const recentOrders = await storage.getUserRecentOrders(userId, 24); // Last 24 hours
    const orderCount = recentOrders.length;
    const totalAmount = recentOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    let risk = 0;

    // High frequency risk
    if (orderCount > 10) risk += 0.8;
    else if (orderCount > 5) risk += 0.5;
    else if (orderCount > 2) risk += 0.2;

    // High amount risk
    if (totalAmount > 1000000)
      risk += 0.6; // > 1M CFA
    else if (totalAmount > 500000) risk += 0.3; // > 500K CFA

    return Math.min(risk, 1.0);
  }

  private async calculateLocationRisk(ipAddress: string, userId: string): Promise<number> {
    // Check for VPN/Tor usage and unusual locations
    let risk = 0;

    // Check if IP is from known VPN/proxy providers (simplified)
    const vpnRanges = ["10.0.0.0", "192.168.0.0", "172.16.0.0"]; // Add real VPN ranges
    if (vpnRanges.some((range) => ipAddress.startsWith(range.split(".")[0]))) {
      risk += 0.4;
    }

    // Check for location changes
    const recentSessions = await storage.getUserRecentSessions(userId, 7); // Last 7 days
    const uniqueIPs = new Set(recentSessions.map((s) => s.ipAddress));

    if (uniqueIPs.size > 10)
      risk += 0.6; // Too many different IPs
    else if (uniqueIPs.size > 5) risk += 0.3;

    return Math.min(risk, 1.0);
  }

  private async calculateDeviceRisk(deviceFingerprint: string, userId: string): Promise<number> {
    if (!deviceFingerprint) return 0.5; // Unknown device

    const knownDevices = await storage.getUserKnownDevices(userId);
    const isKnownDevice = knownDevices.some((d) => d.fingerprint === deviceFingerprint);

    return isKnownDevice ? 0.1 : 0.7; // High risk for unknown devices
  }

  private async calculateBehaviorRisk(userId: string, orderData: any): Promise<number> {
    // Analyze user behavior patterns
    const userProfile = await storage.getUserBehaviorProfile(userId);
    let risk = 0;

    if (!userProfile) return 0.8; // No behavior data

    // Check for unusual order times
    const orderHour = new Date().getHours();
    if (orderHour < 6 || orderHour > 23) risk += 0.3; // Unusual hours

    // Check for unusual order amounts compared to history
    const avgOrderAmount = userProfile.averageOrderAmount || 0;
    const currentAmount = parseFloat(orderData.totalAmount);

    if (avgOrderAmount > 0 && currentAmount > avgOrderAmount * 5) {
      risk += 0.5; // Order 5x larger than usual
    }

    return Math.min(risk, 1.0);
  }

  private async calculateAccountRisk(userId: string): Promise<number> {
    const user = await storage.getUser(userId);
    if (!user) return 1.0;

    let risk = 0;
    const accountAge = (Date.now() - new Date(user.createdAt!).getTime()) / (1000 * 60 * 60 * 24); // days

    // New account risk
    if (accountAge < 1)
      risk += 0.8; // Less than 1 day
    else if (accountAge < 7)
      risk += 0.4; // Less than 1 week
    else if (accountAge < 30) risk += 0.2; // Less than 1 month

    // Unverified account risk
    const verifications = await storage.getUserVerifications(userId);
    const hasEmailVerification = verifications.some(
      (v) => v.verificationType === "email" && v.status === "verified"
    );
    const hasPhoneVerification = verifications.some(
      (v) => v.verificationType === "phone" && v.status === "verified"
    );

    if (!hasEmailVerification) risk += 0.3;
    if (!hasPhoneVerification) risk += 0.2;

    return Math.min(risk, 1.0);
  }

  private async calculatePaymentRisk(paymentMethod: any, userId: string): Promise<number> {
    let risk = 0;

    // Check payment method type
    if (paymentMethod.type === "credit_card") {
      // Check for stolen card patterns
      const cardHash = this.hashCardNumber(paymentMethod.cardNumber);
      const isKnownCard = await storage.isKnownPaymentMethod(userId, cardHash);

      if (!isKnownCard) risk += 0.4; // New payment method
    }

    // Mobile money typically has lower risk in West Africa
    if (paymentMethod.type === "mobile_money") {
      risk += 0.1;
    }

    return Math.min(risk, 1.0);
  }

  private hashCardNumber(cardNumber: string): string {
    return crypto.createHash("sha256").update(cardNumber).digest("hex");
  }

  // Device fingerprinting
  static generateDeviceFingerprint(req: Request): string {
    const components = [
      req.headers["user-agent"] || "",
      req.headers["accept-language"] || "",
      req.headers["accept-encoding"] || "",
      req.headers["accept"] || "",
    ];

    return crypto.createHash("md5").update(components.join("|")).digest("hex");
  }

  // GeoIP lookup (simplified - in production use a proper GeoIP service)
  static async getGeoLocation(ip: string): Promise<any> {
    // This would integrate with a real GeoIP service like MaxMind
    return {
      country: "BF", // Burkina Faso
      city: "Ouagadougou",
      lat: 12.3714,
      lng: -1.5197,
    };
  }
}
