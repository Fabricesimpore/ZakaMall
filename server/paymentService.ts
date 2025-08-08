import { randomUUID } from "crypto";

export interface PaymentRequest {
  orderId: string;
  amount: number;
  phoneNumber: string;
  paymentMethod: "orange_money" | "moov_money" | "cash_on_delivery";
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  operatorReference?: string;
  message: string;
  expiresAt?: Date;
}

export interface PaymentStatus {
  status: "pending" | "completed" | "failed" | "refunded";
  transactionId: string;
  operatorReference?: string;
  failureReason?: string;
}

// Orange Money Payment Service
export class OrangeMoneyService {
  private baseUrl: string;
  private merchantCode: string;
  private apiKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl =
      process.env.ORANGE_MONEY_API_URL || "https://api.orange.com/orange-money-webpay/v1";
    this.merchantCode = process.env.ORANGE_MONEY_MERCHANT_CODE!;
    this.apiKey = process.env.ORANGE_MONEY_API_KEY!;

    if (!this.merchantCode || !this.apiKey) {
      throw new Error(
        "Orange Money credentials not configured. Set ORANGE_MONEY_MERCHANT_CODE and ORANGE_MONEY_API_KEY"
      );
    }
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${this.merchantCode}:${this.apiKey}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        console.error("Orange Money token request failed:", response.status, await response.text());
        return null;
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error("Error getting Orange Money access token:", error);
      return null;
    }
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate phone number format for Orange (Burkina Faso: +226 XX XX XX XX)
      const phoneRegex = /^(\+226|226)?[0-9]{8}$/;
      const cleanPhone = request.phoneNumber.replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        return {
          success: false,
          message: "Numéro Orange Money invalide. Format attendu: +226 XX XX XX XX",
        };
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return {
          success: false,
          message: "Erreur d'authentification Orange Money",
        };
      }

      const transactionId = `OM_${randomUUID()}`;
      const normalizedPhone = cleanPhone.startsWith("+226")
        ? cleanPhone
        : `+226${cleanPhone.replace(/^226/, "")}`;

      // Real Orange Money API call
      const payload = {
        merchant_key: this.merchantCode,
        currency: "XOF",
        order_id: request.orderId,
        amount: request.amount,
        return_url: `${process.env.BASE_URL || "http://localhost:5000"}/api/payments/orange-money/callback`,
        cancel_url: `${process.env.BASE_URL || "http://localhost:5000"}/api/payments/orange-money/cancel`,
        notif_url: `${process.env.BASE_URL || "http://localhost:5000"}/api/payments/orange-money/notify`,
        lang: "fr",
        reference: transactionId,
        customer_msisdn: normalizedPhone,
      };

      const response = await fetch(`${this.baseUrl}/webpayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.status !== "SUCCESS") {
        console.error("Orange Money payment initiation failed:", responseData);
        return {
          success: false,
          message: responseData.message || "Erreur lors de l'initiation du paiement Orange Money",
        };
      }

      return {
        success: true,
        transactionId,
        operatorReference: responseData.pay_token || responseData.txnid,
        message: "Paiement Orange Money initié. Vérifiez votre téléphone pour confirmer.",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      };
    } catch (error) {
      console.error("Orange Money payment error:", error);
      return {
        success: false,
        message: "Erreur lors de l'initiation du paiement Orange Money",
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return {
          status: "failed",
          transactionId,
          failureReason: "Erreur d'authentification Orange Money",
        };
      }

      // Real Orange Money status check API call
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error("Orange Money status check failed:", response.status);
        return {
          status: "failed",
          transactionId,
          failureReason: "Erreur de vérification du statut",
        };
      }

      const statusData = await response.json();

      let status: PaymentStatus["status"] = "pending";
      if (statusData.status === "SUCCESS" || statusData.transaction_status === "SUCCESSFUL") {
        status = "completed";
      } else if (statusData.status === "FAILED" || statusData.transaction_status === "FAILED") {
        status = "failed";
      }

      return {
        status,
        transactionId,
        operatorReference: statusData.txnid || statusData.operator_reference,
        failureReason:
          status === "failed" ? statusData.message || "Transaction échouée" : undefined,
      };
    } catch (error) {
      console.error("Orange Money status check error:", error);
      return {
        status: "failed",
        transactionId,
        failureReason: "Erreur de vérification du statut",
      };
    }
  }
}

// Moov Money Payment Service
export class MoovMoneyService {
  private baseUrl: string;
  private merchantId: string;
  private apiKey: string;
  private apiSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.baseUrl = process.env.MOOV_MONEY_API_URL || "https://api.moov-africa.bf/v1";
    this.merchantId = process.env.MOOV_MONEY_MERCHANT_ID!;
    this.apiKey = process.env.MOOV_MONEY_API_KEY!;
    this.apiSecret = process.env.MOOV_MONEY_API_SECRET!;

    if (!this.merchantId || !this.apiKey || !this.apiSecret) {
      throw new Error(
        "Moov Money credentials not configured. Set MOOV_MONEY_MERCHANT_ID, MOOV_MONEY_API_KEY, and MOOV_MONEY_API_SECRET"
      );
    }
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64");

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          scope: "collect",
        }),
      });

      if (!response.ok) {
        console.error("Moov Money token request failed:", response.status, await response.text());
        return null;
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error("Error getting Moov Money access token:", error);
      return null;
    }
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate phone number format for Moov (Burkina Faso)
      const phoneRegex = /^(\+226|226)?[0-9]{8}$/;
      const cleanPhone = request.phoneNumber.replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        return {
          success: false,
          message: "Numéro Moov Money invalide. Format attendu: +226 XX XX XX XX",
        };
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return {
          success: false,
          message: "Erreur d'authentification Moov Money",
        };
      }

      const transactionId = `MM_${randomUUID()}`;
      const normalizedPhone = cleanPhone.startsWith("+226")
        ? cleanPhone
        : `+226${cleanPhone.replace(/^226/, "")}`;

      // Real Moov Money API call
      const payload = {
        reference: transactionId,
        subscriber: {
          country: "BF",
          currency: "XOF",
          msisdn: normalizedPhone,
        },
        transaction: {
          amount: request.amount,
          currency: "XOF",
          type: "collection",
        },
        partner: {
          id: this.merchantId,
        },
      };

      const response = await fetch(`${this.baseUrl}/payins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "X-Target-Environment": "bf",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.status !== "PENDING") {
        console.error("Moov Money payment initiation failed:", responseData);
        return {
          success: false,
          message: responseData.message || "Erreur lors de l'initiation du paiement Moov Money",
        };
      }

      return {
        success: true,
        transactionId,
        operatorReference: responseData.transactionId || responseData.reference,
        message: "Paiement Moov Money initié. Composez *155# pour confirmer.",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
    } catch (error) {
      console.error("Moov Money payment error:", error);
      return {
        success: false,
        message: "Erreur lors de l'initiation du paiement Moov Money",
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return {
          status: "failed",
          transactionId,
          failureReason: "Erreur d'authentification Moov Money",
        };
      }

      // Real Moov Money status check API call
      const response = await fetch(`${this.baseUrl}/payins/${transactionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "X-Target-Environment": "bf",
        },
      });

      if (!response.ok) {
        console.error("Moov Money status check failed:", response.status);
        return {
          status: "failed",
          transactionId,
          failureReason: "Erreur de vérification du statut",
        };
      }

      const statusData = await response.json();

      let status: PaymentStatus["status"] = "pending";
      if (statusData.status === "SUCCESSFUL" || statusData.status === "COMPLETED") {
        status = "completed";
      } else if (statusData.status === "FAILED" || statusData.status === "REJECTED") {
        status = "failed";
      }

      return {
        status,
        transactionId,
        operatorReference: statusData.transactionId || statusData.reference,
        failureReason: status === "failed" ? statusData.reason || "Transaction échouée" : undefined,
      };
    } catch (error) {
      console.error("Moov Money status check error:", error);
      return {
        status: "failed",
        transactionId,
        failureReason: "Erreur de vérification du statut",
      };
    }
  }
}

// Cash on Delivery Service
export class CashOnDeliveryService {
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Cash on delivery always succeeds immediately
    const transactionId = `COD_${randomUUID()}`;

    return {
      success: true,
      transactionId,
      message: "Paiement à la livraison confirmé. Payez au livreur lors de la réception.",
    };
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    // COD payments are always pending until manual confirmation by driver
    return {
      status: "pending",
      transactionId,
    };
  }
}

// Main Payment Service Factory
export class PaymentServiceFactory {
  static getService(paymentMethod: "orange_money" | "moov_money" | "cash_on_delivery") {
    switch (paymentMethod) {
      case "orange_money":
        return new OrangeMoneyService();
      case "moov_money":
        return new MoovMoneyService();
      case "cash_on_delivery":
        return new CashOnDeliveryService();
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }
}
