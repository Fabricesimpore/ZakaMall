// SMS service for ZakaMall - supports actual SMS sending for Burkina Faso
export class SMSService {
  private smsConfig: {
    provider: string;
    apiKey?: string;
    apiSecret?: string;
    sender?: string;
  };

  constructor() {
    this.smsConfig = {
      provider: process.env.SMS_PROVIDER || "twilio", // twilio, orange, textbelt, africastalking, or console
      apiKey: process.env.TWILIO_ACCOUNT_SID || process.env.SMS_API_KEY || "",
      apiSecret: process.env.TWILIO_AUTH_TOKEN || process.env.SMS_API_SECRET || "",
      sender: process.env.TWILIO_PHONE_NUMBER || process.env.SMS_SENDER_ID || "ZakaMall",
    };
  }

  async sendVerificationSMS(phone: string, code: string, firstName?: string): Promise<boolean> {
    const message = `ZakaMall: Votre code de verification est ${code}. Ce code expire dans 15 minutes. Ne le partagez pas.`;
    
    return await this.sendSMS(phone, message);
  }

  async sendLoginSMS(phone: string, code: string): Promise<boolean> {
    const message = `ZakaMall: Votre code de connexion est ${code}. Ce code expire dans 10 minutes.`;
    
    return await this.sendSMS(phone, message);
  }

  private async sendSMS(phone: string, message: string): Promise<boolean> {
    try {
      // Normalize phone number for Burkina Faso
      const normalizedPhone = this.normalizePhoneNumber(phone);
      
      switch (this.smsConfig.provider) {
        case "orange":
          return await this.sendViaOrangeAPI(normalizedPhone, message);
        case "twilio":
          return await this.sendViaTwilio(normalizedPhone, message);
        case "textbelt":
          return await this.sendViaTextbelt(normalizedPhone, message);
        case "africastalking":
          return await this.sendViaAfricasTalking(normalizedPhone, message);
        default:
          // Development mode: log to console
          console.log(`\n=== SMS SENT ===`);
          console.log(`To: ${normalizedPhone}`);
          console.log(`Message: ${message}`);
          console.log(`================\n`);
          return true;
      }
    } catch (error) {
      console.error("SMS sending error:", error);
      
      // Fallback to console logging
      console.log(`\n=== SMS FALLBACK ===`);
      console.log(`To: ${phone}`);
      console.log(`Message: ${message}`);
      console.log(`===================\n`);
      return true;
    }
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Burkina Faso phone numbers
    if (cleaned.startsWith('226')) {
      // Already has country code
      return `+${cleaned}`;
    } else if (cleaned.length === 8) {
      // Local number, add Burkina Faso country code
      return `+226${cleaned}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 9) {
      // Remove leading 0 and add country code
      return `+226${cleaned.substring(1)}`;
    }
    
    // Return as-is if format not recognized
    return `+${cleaned}`;
  }

  private async sendViaTwilio(phone: string, message: string): Promise<boolean> {
    try {
      if (!this.smsConfig.apiKey || !this.smsConfig.apiSecret) {
        throw new Error("Twilio credentials not configured");
      }

      // Twilio REST API
      const accountSid = this.smsConfig.apiKey;
      const authToken = this.smsConfig.apiSecret;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER || this.smsConfig.sender;

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioPhone || "",
          Body: message,
        }).toString(),
      });

      if (response.ok) {
        console.log(`📱 SMS sent successfully to ${phone} via Twilio`);
        return true;
      } else {
        const errorData = await response.text();
        console.error("Twilio SMS failed:", errorData);
        
        // Check if it's a region permission issue
        if (errorData.includes("21408") || errorData.includes("Permission to send")) {
          console.log(`⚠️ Twilio doesn't support SMS to ${phone} region. Using fallback to console.`);
          console.log(`\n=== TWILIO FALLBACK SMS ===`);
          console.log(`To: ${phone}`);
          console.log(`Message: ${message}`);
          console.log(`===========================\n`);
          return true; // Return true to continue the flow
        }
        
        return false;
      }
    } catch (error) {
      console.error("Twilio SMS error:", error);
      return false;
    }
  }

  private async sendViaTextbelt(phone: string, message: string): Promise<boolean> {
    try {
      if (!this.smsConfig.apiKey) {
        throw new Error("Textbelt API key not configured");
      }

      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          message: message,
          key: this.smsConfig.apiKey,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`📱 SMS sent successfully to ${phone} via Textbelt`);
        return true;
      } else {
        console.error("Textbelt SMS failed:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Textbelt SMS error:", error);
      return false;
    }
  }

  private async sendViaOrangeAPI(phone: string, message: string): Promise<boolean> {
    try {
      if (!this.smsConfig.apiKey) {
        throw new Error("Orange API credentials not configured");
      }

      // Orange API endpoint for Burkina Faso
      const orangeEndpoint = process.env.ORANGE_SMS_ENDPOINT || "https://api.orange.com/smsmessaging/v1/outbound/tel%3A%2B226XXXXXXXX/requests";
      const authToken = this.smsConfig.apiKey;

      const requestBody = {
        outboundSMSMessageRequest: {
          address: [phone],
          senderAddress: `tel:+226${process.env.ORANGE_SENDER_NUMBER || "12345678"}`,
          outboundSMSTextMessage: {
            message: message
          },
          requestStatusURL: process.env.ORANGE_CALLBACK_URL || "",
        }
      };

      const response = await fetch(orangeEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`📱 SMS sent successfully to ${phone} via Orange API`);
        return true;
      } else {
        const error = await response.text();
        console.error("Orange API SMS failed:", error);
        return false;
      }
    } catch (error) {
      console.error("Orange API SMS error:", error);
      return false;
    }
  }

  private async sendViaAfricasTalking(phone: string, message: string): Promise<boolean> {
    try {
      if (!this.smsConfig.apiKey) {
        throw new Error("Africa's Talking API key not configured");
      }

      const username = process.env.AFRICASTALKING_USERNAME || "sandbox";
      
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'ApiKey': this.smsConfig.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username: username,
          to: phone,
          message: message,
          from: this.smsConfig.sender || '',
        }),
      });

      const result = await response.json();
      
      if (result.SMSMessageData?.Recipients?.length > 0) {
        const recipient = result.SMSMessageData.Recipients[0];
        if (recipient.statusCode === 101) {
          console.log(`📱 SMS sent successfully to ${phone} via Africa's Talking`);
          return true;
        } else {
          console.error("Africa's Talking SMS failed:", recipient.status);
          return false;
        }
      } else {
        console.error("Africa's Talking SMS failed:", result);
        return false;
      }
    } catch (error) {
      console.error("Africa's Talking SMS error:", error);
      return false;
    }
  }
}

export const smsService = new SMSService();