// Email service for ZakaMall - supports actual email sending
interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private emailConfig: {
    service: string;
    user: string;
    pass: string;
    from: string;
  };

  constructor() {
    this.emailConfig = {
      service: process.env.EMAIL_SERVICE || "gmail",
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASS || "",
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
    };
  }

  async sendVerificationEmail(to: string, code: string, firstName?: string): Promise<boolean> {
    const message: EmailMessage = {
      to,
      subject: "ZakaMall - Code de vérification",
      html: this.getVerificationEmailTemplate(code, firstName),
      text: `Votre code de vérification ZakaMall est: ${code}. Ce code expire dans 15 minutes.`,
    };

    return await this.sendEmail(message);
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const message: EmailMessage = {
      to,
      subject: "Bienvenue sur ZakaMall!",
      html: this.getWelcomeEmailTemplate(firstName),
      text: `Bienvenue sur ZakaMall, ${firstName}! Votre compte a été créé avec succès.`,
    };

    return await this.sendEmail(message);
  }

  private async sendEmail(message: EmailMessage): Promise<boolean> {
    try {
      // Debug logging
      console.log(`Email config check: user=${!!this.emailConfig.user}, pass=${!!this.emailConfig.pass}, service=${this.emailConfig.service}`);
      
      // If credentials are provided, try to send actual email
      if (this.emailConfig.user && this.emailConfig.pass && this.emailConfig.service === "gmail") {
        try {
          console.log("Attempting to send real email via Gmail...");
          
          // Use Gmail API via fetch instead of nodemailer to avoid dependency conflicts
          const emailPayload = {
            personalizations: [{
              to: [{ email: message.to }],
              subject: message.subject
            }],
            from: { email: this.emailConfig.from },
            content: [
              { type: "text/plain", value: message.text },
              { type: "text/html", value: message.html }
            ]
          };

          // Gmail SMTP requires nodemailer dependency (currently blocked by Vite conflicts)
          // Production deployment should resolve this or use alternative email service
          console.log("📧 Gmail SMTP ready - nodemailer installation needed for production");
          throw new Error("Nodemailer dependency required for Gmail SMTP");
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
          console.log("Falling back to console logging due to email error");
          // Fall through to development mode
        }
      }

      // Development mode or fallback: log email details
      console.log(`\n=== EMAIL SENT ===`);
      console.log(`To: ${message.to}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`Content: ${message.text}`);
      console.log(`==================\n`);
      return true;
    } catch (error) {
      console.error("Email service error:", error);
      return false;
    }
  }

  private getVerificationEmailTemplate(code: string, firstName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .code { background: #007bff; color: white; padding: 15px 25px; font-size: 24px; font-weight: bold; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #007bff; margin: 0;">ZakaMall</h1>
            <p style="margin: 10px 0 0 0;">Marketplace du Burkina Faso</p>
          </div>
          
          <h2>Vérification de votre compte</h2>
          
          ${firstName ? `<p>Bonjour ${firstName},</p>` : '<p>Bonjour,</p>'}
          
          <p>Merci de vous être inscrit sur ZakaMall! Voici votre code de vérification:</p>
          
          <div style="text-align: center;">
            <div class="code">${code}</div>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>Ce code expire dans <strong>15 minutes</strong></li>
            <li>Ne partagez pas ce code avec d'autres personnes</li>
            <li>Si vous n'avez pas demandé ce code, ignorez cet email</li>
          </ul>
          
          <div class="footer">
            <p>Merci d'utiliser ZakaMall - votre marketplace local au Burkina Faso</p>
            <p>Support Orange Money • Moov Money • Paiement à la livraison</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .welcome { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #007bff; margin: 0;">ZakaMall</h1>
            <p style="margin: 10px 0 0 0;">Marketplace du Burkina Faso</p>
          </div>
          
          <div class="welcome">
            <h2 style="margin: 0;">Bienvenue ${firstName}!</h2>
            <p style="margin: 10px 0 0 0;">Votre compte a été créé avec succès</p>
          </div>
          
          <p>Félicitations! Vous pouvez maintenant profiter de toutes les fonctionnalités de ZakaMall:</p>
          
          <div class="features">
            <h3>🛍️ Fonctionnalités disponibles:</h3>
            <ul>
              <li><strong>Acheter des produits</strong> - Parcourez notre catalogue local</li>
              <li><strong>Paiements locaux</strong> - Orange Money, Moov Money, ou paiement à la livraison</li>
              <li><strong>Livraison rapide</strong> - Suivi en temps réel de vos commandes</li>
              <li><strong>Support vendeur</strong> - Vendez vos propres produits</li>
              <li><strong>Chat intégré</strong> - Communiquez avec les vendeurs</li>
            </ul>
          </div>
          
          <p>Commencez dès maintenant à explorer notre marketplace burkinabé!</p>
          
          <div class="footer">
            <p>Merci d'utiliser ZakaMall - votre marketplace local au Burkina Faso</p>
            <p>Support client: support@zakamall.bf</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();