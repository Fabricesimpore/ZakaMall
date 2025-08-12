import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPaymentMethods } from "@/hooks/useSavedPaymentMethods";
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
  const [useNewMethod, setUseNewMethod] = useState(false);
  const [saveMethod, setSaveMethod] = useState(false);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { savedMethods, savePaymentMethod, getDefaultPaymentMethod, hasPaymentMethods } =
    useSavedPaymentMethods();

  // Initialize with default saved method if available
  useEffect(() => {
    if (isAuthenticated && hasPaymentMethods && !useNewMethod) {
      const defaultMethod = getDefaultPaymentMethod();
      if (defaultMethod) {
        setSelectedSavedMethod(defaultMethod.id);
        setPaymentMethod(defaultMethod.type);
      } else if (savedMethods.length > 0) {
        const firstMethod = savedMethods[0];
        setSelectedSavedMethod(firstMethod.id);
        setPaymentMethod(firstMethod.type);
      }
    }
  }, [isAuthenticated, hasPaymentMethods, useNewMethod, getDefaultPaymentMethod, savedMethods]);

  const initiatePaymentMutation = useMutation({
    mutationFn: async (data: { orderId: string; paymentMethod: string; phoneNumber?: string }) => {
      const response = await apiRequest("POST", "/api/payments/initiate", data);
      return response.json();
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
      const response = await apiRequest("GET", `/api/payments/${paymentId}/status`);
      return response.json();
    },
    onSuccess: (data: { success: boolean; message: string; failureReason?: string }) => {
      if ((data as { status?: string }).status === "completed") {
        setIsProcessing(false);
        toast({
          title: "Paiement réussi",
          description: "Votre commande a été confirmée",
        });
        onPaymentSuccess();
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        onClose();
      } else if ((data as { status?: string }).status === "failed") {
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

    let actualPhoneNumber = phoneNumber.trim();

    // If using saved method, get phone number from saved method
    if (!useNewMethod && selectedSavedMethod && paymentMethod !== "cash_on_delivery") {
      const savedMethod = savedMethods.find((m) => m.id === selectedSavedMethod);
      if (savedMethod) {
        actualPhoneNumber = savedMethod.phoneNumber;
      }
    }

    if (paymentMethod !== "cash_on_delivery" && !actualPhoneNumber) {
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
      if (!phoneRegex.test(actualPhoneNumber.replace(/\s/g, ""))) {
        toast({
          title: "Numéro invalide",
          description: "Format attendu: +226 XX XX XX XX",
          variant: "destructive",
        });
        return;
      }
    }

    // Save new payment method if requested
    if (useNewMethod && saveMethod && isAuthenticated && paymentMethod !== "cash_on_delivery") {
      savePaymentMethod(paymentMethod, actualPhoneNumber, false);
    }

    initiatePaymentMutation.mutate({
      orderId,
      paymentMethod,
      phoneNumber: actualPhoneNumber,
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

              {/* Saved Payment Methods */}
              {isAuthenticated && hasPaymentMethods && !useNewMethod && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Méthodes sauvegardées</Label>
                  <RadioGroup
                    value={selectedSavedMethod || ""}
                    onValueChange={(value: string) => {
                      setSelectedSavedMethod(value);
                      const method = savedMethods.find((m) => m.id === value);
                      if (method) {
                        setPaymentMethod(method.type);
                      }
                    }}
                  >
                    {savedMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg"
                      >
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label
                          htmlFor={method.id}
                          className="flex items-center cursor-pointer flex-1"
                        >
                          <div
                            className={`w-8 h-8 rounded mr-3 flex items-center justify-center ${
                              method.type === "orange_money" ? "bg-orange-500" : "bg-blue-600"
                            }`}
                          >
                            <span className="text-white text-xs font-bold">
                              {method.type === "orange_money" ? "OM" : "MM"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {method.type === "orange_money" ? "Orange Money" : "Moov Money"}
                            </div>
                            <div className="text-sm text-gray-600">{method.maskedNumber}</div>
                          </div>
                          {method.isDefault && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Par défaut
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUseNewMethod(true);
                      setSelectedSavedMethod(null);
                      setPhoneNumber("");
                    }}
                    className="w-full"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Utiliser une nouvelle méthode
                  </Button>
                </div>
              )}

              {/* New Payment Method Selection */}
              {(useNewMethod || !isAuthenticated || !hasPaymentMethods) && (
                <div className="space-y-3">
                  {isAuthenticated && hasPaymentMethods && (
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Nouvelle méthode</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUseNewMethod(false);
                          setPhoneNumber("");
                        }}
                      >
                        Retour aux méthodes sauvegardées
                      </Button>
                    </div>
                  )}

                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: "orange_money" | "moov_money" | "cash_on_delivery") =>
                      setPaymentMethod(value)
                    }
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
                      <Label
                        htmlFor="cash_on_delivery"
                        className="flex items-center cursor-pointer"
                      >
                        <div className="w-8 h-8 bg-gray-600 rounded mr-3 flex items-center justify-center">
                          <i className="fas fa-money-bill-wave text-white text-xs"></i>
                        </div>
                        Paiement à la livraison
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            {paymentMethod !== "cash_on_delivery" &&
              (useNewMethod || !isAuthenticated || !hasPaymentMethods) && (
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

                  {/* Save Method Checkbox */}
                  {isAuthenticated && (
                    <div className="flex items-center space-x-2 mt-3">
                      <input
                        type="checkbox"
                        id="saveMethod"
                        checked={saveMethod}
                        onChange={(e) => setSaveMethod(e.target.checked)}
                        className="h-4 w-4 text-zaka-blue focus:ring-zaka-blue border-gray-300 rounded"
                      />
                      <Label htmlFor="saveMethod" className="text-sm text-gray-700 cursor-pointer">
                        Sauvegarder cette méthode de paiement
                      </Label>
                    </div>
                  )}
                </div>
              )}

            {/* Display selected saved method info */}
            {paymentMethod !== "cash_on_delivery" && !useNewMethod && selectedSavedMethod && (
              <div className="bg-gray-50 border rounded-lg p-3">
                <Label className="text-sm font-medium text-gray-700">Méthode sélectionnée</Label>
                <div className="mt-2">
                  {(() => {
                    const method = savedMethods.find((m) => m.id === selectedSavedMethod);
                    return method ? (
                      <div className="flex items-center">
                        <div
                          className={`w-6 h-6 rounded mr-2 flex items-center justify-center ${
                            method.type === "orange_money" ? "bg-orange-500" : "bg-blue-600"
                          }`}
                        >
                          <span className="text-white text-xs font-bold">
                            {method.type === "orange_money" ? "OM" : "MM"}
                          </span>
                        </div>
                        <span className="text-sm">{method.maskedNumber}</span>
                      </div>
                    ) : null;
                  })()}
                </div>
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
