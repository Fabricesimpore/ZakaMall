import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppSupportProps {
  className?: string;
  productId?: string;
  orderId?: string;
  variant?: "floating" | "inline" | "compact";
}

export default function WhatsAppSupport({
  className = "",
  productId,
  orderId,
  variant = "floating",
}: WhatsAppSupportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const { toast } = useToast();

  // ZakaMall customer service WhatsApp number (Burkina Faso format)
  const whatsappNumber = "+22670123456"; // Replace with actual customer service number

  const getDefaultMessage = () => {
    let baseMessage = "Bonjour ZakaMall Support! 👋\n\n";

    if (orderId) {
      baseMessage += `J'ai besoin d'aide concernant ma commande #${orderId}.\n\n`;
    } else if (productId) {
      baseMessage += `J'ai une question sur le produit ID: ${productId}.\n\n`;
    } else {
      baseMessage += "J'aimerais avoir de l'aide concernant:\n\n";
    }

    baseMessage += "Détails:\n";
    return baseMessage;
  };

  const handleQuickContact = () => {
    const quickMessage = encodeURIComponent(getDefaultMessage() + "Merci!");
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace("+", "")}?text=${quickMessage}`;
    window.open(whatsappUrl, "_blank");

    toast({
      title: "Redirection vers WhatsApp",
      description: "Vous allez être redirigé vers WhatsApp pour contacter notre support.",
    });
  };

  const handleCustomMessage = () => {
    if (!message.trim()) {
      toast({
        title: "Message requis",
        description: "Veuillez saisir votre message avant d'envoyer.",
        variant: "destructive",
      });
      return;
    }

    let fullMessage = getDefaultMessage();
    fullMessage += message;

    if (customerName) {
      fullMessage += `\n\nNom: ${customerName}`;
    }
    if (customerPhone) {
      fullMessage += `\nTéléphone: ${customerPhone}`;
    }

    fullMessage += "\n\nMerci pour votre aide! 🙏";

    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace("+", "")}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");

    setIsOpen(false);
    setMessage("");
    setCustomerName("");
    setCustomerPhone("");

    toast({
      title: "Message envoyé!",
      description:
        "Votre message a été ouvert dans WhatsApp. Notre équipe vous répondra rapidement.",
    });
  };

  if (variant === "floating") {
    return (
      <>
        {/* Floating WhatsApp Button */}
        <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                aria-label="Contacter le support WhatsApp"
              >
                <i className="fab fa-whatsapp text-2xl"></i>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <i className="fab fa-whatsapp text-green-500 mr-2"></i>
                  Support WhatsApp
                </DialogTitle>
                <DialogDescription>
                  Contactez notre équipe support directement via WhatsApp pour une aide rapide.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Button
                  onClick={handleQuickContact}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  <i className="fab fa-whatsapp mr-2"></i>
                  Contact rapide
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      ou personnaliser votre message
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customer-name">Votre nom (optionnel)</Label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer-phone">Votre téléphone (optionnel)</Label>
                    <Input
                      id="customer-phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ex: +226 70 12 34 56"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Votre message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez votre demande..."
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleCustomMessage}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <i className="fab fa-whatsapp mr-2"></i>
                    Envoyer le message
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Floating tooltip */}
        <div className="fixed bottom-20 right-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
            Besoin d'aide ? 💬
            <div className="absolute bottom-[-6px] right-4 w-3 h-3 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      </>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        onClick={handleQuickContact}
        variant="outline"
        size="sm"
        className={`text-green-600 border-green-600 hover:bg-green-50 ${className}`}
      >
        <i className="fab fa-whatsapp mr-2"></i>
        Support
      </Button>
    );
  }

  // Inline variant
  return (
    <div className={`border rounded-lg p-4 bg-green-50 dark:bg-green-950 ${className}`}>
      <div className="flex items-center mb-3">
        <i className="fab fa-whatsapp text-green-500 text-xl mr-3"></i>
        <div>
          <h3 className="font-semibold text-green-700 dark:text-green-300">Besoin d'aide ?</h3>
          <p className="text-sm text-green-600 dark:text-green-400">
            Contactez notre support via WhatsApp
          </p>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={handleQuickContact}
          size="sm"
          className="bg-green-500 hover:bg-green-600 flex-1"
        >
          <i className="fab fa-whatsapp mr-2"></i>
          Contact rapide
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-green-600 border-green-600">
              Personnaliser
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className="fab fa-whatsapp text-green-500 mr-2"></i>
                Message personnalisé
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label htmlFor="inline-name">Votre nom (optionnel)</Label>
                <Input
                  id="inline-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div>
                <Label htmlFor="inline-message">Votre message</Label>
                <Textarea
                  id="inline-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre demande..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleCustomMessage}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <i className="fab fa-whatsapp mr-2"></i>
                Envoyer via WhatsApp
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
