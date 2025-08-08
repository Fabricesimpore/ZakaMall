import { randomUUID } from "crypto";

export interface PaymentRequest {
  orderId: string;
  amount: number;
  phoneNumber: string;
  paymentMethod: 'orange_money' | 'moov_money' | 'cash_on_delivery';
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  operatorReference?: string;
  message: string;
  expiresAt?: Date;
}

export interface PaymentStatus {
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  operatorReference?: string;
  failureReason?: string;
}

// Orange Money Payment Service
export class OrangeMoneyService {
  private baseUrl: string;
  private merchantCode: string;
  private apiKey: string;

  constructor() {
    // In production, these would come from environment variables
    this.baseUrl = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/dev/v1';
    this.merchantCode = process.env.ORANGE_MONEY_MERCHANT_CODE || 'DEMO_MERCHANT';
    this.apiKey = process.env.ORANGE_MONEY_API_KEY || 'demo_key';
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate phone number format for Orange (Burkina Faso: +226 XX XX XX XX)
      const phoneRegex = /^(\+226|226)?[0-9]{8}$/;
      if (!phoneRegex.test(request.phoneNumber.replace(/\s/g, ''))) {
        return {
          success: false,
          message: "Numéro Orange Money invalide. Format attendu: +226 XX XX XX XX"
        };
      }

      const transactionId = `OM_${randomUUID()}`;
      
      // For demo purposes, simulate API call
      // In production, this would be a real API call to Orange Money
      const payload = {
        merchant_code: this.merchantCode,
        currency: 'XOF', // West African CFA Franc
        order_id: request.orderId,
        amount: request.amount,
        return_url: `${process.env.BASE_URL}/api/payments/orange-money/callback`,
        cancel_url: `${process.env.BASE_URL}/api/payments/orange-money/cancel`,
        notif_url: `${process.env.BASE_URL}/api/payments/orange-money/notify`,
        lang: 'fr',
        reference: transactionId,
        phone_number: request.phoneNumber.replace(/\s/g, ''),
      };

      // Simulate successful payment initiation
      console.log('Orange Money payment initiated:', payload);
      
      return {
        success: true,
        transactionId,
        operatorReference: `OM_REF_${Date.now()}`,
        message: "Paiement Orange Money initié. Vérifiez votre téléphone pour confirmer.",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
      };

    } catch (error) {
      console.error('Orange Money payment error:', error);
      return {
        success: false,
        message: "Erreur lors de l'initiation du paiement Orange Money"
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      // In production, this would check the actual payment status
      // For demo, simulate random success/pending states
      const statuses: PaymentStatus['status'][] = ['pending', 'completed', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        status: randomStatus,
        transactionId,
        operatorReference: `OM_REF_${Date.now()}`,
        failureReason: randomStatus === 'failed' ? 'Solde insuffisant' : undefined
      };
    } catch (error) {
      console.error('Orange Money status check error:', error);
      return {
        status: 'failed',
        transactionId,
        failureReason: 'Erreur de vérification du statut'
      };
    }
  }
}

// Moov Money Payment Service
export class MoovMoneyService {
  private baseUrl: string;
  private merchantId: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.MOOV_MONEY_API_URL || 'https://api.moov-africa.com/v1';
    this.merchantId = process.env.MOOV_MONEY_MERCHANT_ID || 'DEMO_MERCHANT';
    this.apiKey = process.env.MOOV_MONEY_API_KEY || 'demo_key';
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate phone number format for Moov (Burkina Faso)
      const phoneRegex = /^(\+226|226)?[0-9]{8}$/;
      if (!phoneRegex.test(request.phoneNumber.replace(/\s/g, ''))) {
        return {
          success: false,
          message: "Numéro Moov Money invalide. Format attendu: +226 XX XX XX XX"
        };
      }

      const transactionId = `MM_${randomUUID()}`;
      
      // For demo purposes, simulate API call
      const payload = {
        merchant_id: this.merchantId,
        currency: 'XOF',
        order_id: request.orderId,
        amount: request.amount,
        callback_url: `${process.env.BASE_URL}/api/payments/moov-money/callback`,
        reference: transactionId,
        phone_number: request.phoneNumber.replace(/\s/g, ''),
      };

      console.log('Moov Money payment initiated:', payload);
      
      return {
        success: true,
        transactionId,
        operatorReference: `MM_REF_${Date.now()}`,
        message: "Paiement Moov Money initié. Composez *155# pour confirmer.",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      };

    } catch (error) {
      console.error('Moov Money payment error:', error);
      return {
        success: false,
        message: "Erreur lors de l'initiation du paiement Moov Money"
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const statuses: PaymentStatus['status'][] = ['pending', 'completed', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        status: randomStatus,
        transactionId,
        operatorReference: `MM_REF_${Date.now()}`,
        failureReason: randomStatus === 'failed' ? 'Transaction rejetée par l\'utilisateur' : undefined
      };
    } catch (error) {
      console.error('Moov Money status check error:', error);
      return {
        status: 'failed',
        transactionId,
        failureReason: 'Erreur de vérification du statut'
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
      message: "Paiement à la livraison confirmé. Payez au livreur lors de la réception."
    };
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    // COD payments are always pending until manual confirmation by driver
    return {
      status: 'pending',
      transactionId
    };
  }
}

// Main Payment Service Factory
export class PaymentServiceFactory {
  static getService(paymentMethod: 'orange_money' | 'moov_money' | 'cash_on_delivery') {
    switch (paymentMethod) {
      case 'orange_money':
        return new OrangeMoneyService();
      case 'moov_money':
        return new MoovMoneyService();
      case 'cash_on_delivery':
        return new CashOnDeliveryService();
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }
}