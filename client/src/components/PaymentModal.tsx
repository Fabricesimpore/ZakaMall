import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";
import { Loader2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<
    "orange_money" | "moov_money" | "cash_on_delivery"
  >("orange_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setPaymentId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const initiatePaymentMutation = useMutation({
    mutationFn: async (data: { orderId: string; paymentMethod: string; phoneNumber?: string }) => {
      return await apiRequest("POST", "/api/payments/initiate", data);
    },
    onSuccess: async (data: { success: boolean; message: string; paymentId: string }) => {
      setPaymentId(data.paymentId);

      if (paymentMethod === "cash_on_delivery") {
        toast({
          title: "Commande confirmée",
          description: "Votre commande sera payée à la livraison",
        });
        onPaymentSuccess();
        onClose();
        return;
      }

      toast({
        title: "Paiement initié",
        description: data.message,
      });

      // Start polling payment status
      setIsProcessing(true);
      pollPaymentStatus(data.paymentId);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de paiement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkPaymentStatusMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return await apiRequest("GET", `/api/payments/${paymentId}/status`);
    },
    onSuccess: (data: { success: boolean; message: string }) => {
      if (data.status === "completed") {
        setIsProcessing(false);
        toast({
          title: "Paiement réussi",
          description: "Votre commande a été confirmée",
        });
        onPaymentSuccess();
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        onClose();
      } else if (data.status === "failed") {
        setIsProcessing(false);
        toast({
          title: "Paiement échoué",
          description: data.failureReason || "Le paiement a échoué",
          variant: "destructive",
        });
      }
      // If pending, continue polling
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pollPaymentStatus = (paymentId: string) => {
    const interval = setInterval(() => {
      checkPaymentStatusMutation.mutate(paymentId);
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (isProcessing) {
        setIsProcessing(false);
        toast({
          title: "Délai dépassé",
          description: "Vérifiez le statut de votre paiement dans vos commandes",
          variant: "destructive",
        });
      }
    }, 300000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod !== "cash_on_delivery" && !phoneNumber.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre numéro de téléphone",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    if (paymentMethod !== "cash_on_delivery") {
      const phoneRegex = /^(\+226|226)?[0-9]{8}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
        toast({
          title: "Numéro invalide",
          description: "Format attendu: +226 XX XX XX XX",
          variant: "destructive",
        });
        return;
      }
    }

    initiatePaymentMutation.mutate({
      orderId,
      paymentMethod,
      phoneNumber: phoneNumber.trim(),
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("fr-BF") + " CFA";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement de la commande</DialogTitle>
          <DialogDescription>
            Montant à payer: <strong>{formatAmount(totalAmount)}</strong>
          </DialogDescription>
        </DialogHeader>

        {isProcessing ? (
          <div className="flex flex-col items-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-zaka-orange" />
            <div className="text-center">
              <p className="font-medium">Traitement du paiement en cours...</p>
              <p className="text-sm text-gray-600 mt-1">
                {paymentMethod === "orange_money"
                  ? "Vérifiez votre téléphone et suivez les instructions"
                  : "Composez *155# pour confirmer le paiement"}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Méthode de paiement</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value: "orange_money" | "moov_money" | "cash_on_delivery") => setPaymentMethod(value)}
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="orange_money" id="orange_money" />
                  <Label htmlFor="orange_money" className="flex items-center cursor-pointer">
                    <div className="w-8 h-8 bg-orange-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">OM</span>
                    </div>
                    Orange Money
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="moov_money" id="moov_money" />
                  <Label htmlFor="moov_money" className="flex items-center cursor-pointer">
                    <div className="w-8 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MM</span>
                    </div>
                    Moov Money
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                  <Label htmlFor="cash_on_delivery" className="flex items-center cursor-pointer">
                    <div className="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
                      <i className="fas fa-money-bill-wave text-white text-xs"></i>
                    </div>
                    Paiement à la livraison
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod !== "cash_on_delivery" && (
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+226 XX XX XX XX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  {paymentMethod === "orange_money"
                    ? "Numéro Orange Money pour recevoir la demande de paiement"
                    : "Numéro Moov Money pour recevoir la demande de paiement"}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={initiatePaymentMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-zaka-orange hover:bg-zaka-orange/90"
                disabled={initiatePaymentMutation.isPending}
              >
                {initiatePaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <i className="fas fa-credit-card mr-2"></i>
                    Payer {formatAmount(totalAmount)}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
