import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const paymentFormSchema = z
  .object({
    paymentMethod: z.enum(["orange_money", "moov_money", "cash_on_delivery"]),
    phoneNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        (data.paymentMethod === "orange_money" || data.paymentMethod === "moov_money") &&
        !data.phoneNumber
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Numéro de téléphone requis pour les paiements mobiles",
      path: ["phoneNumber"],
    }
  );

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentMethodSelectorProps {
  orderId: string;
  totalAmount: number;
  onPaymentSuccess: (_paymentId: string, _transactionId: string) => void;
  onPaymentError: (_errorMessage: string) => void;
}

export default function PaymentMethodSelector({
  orderId,
  totalAmount,
  onPaymentSuccess,
  onPaymentError,
}: PaymentMethodSelectorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: "orange_money",
      phoneNumber: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const initiatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("POST", "/api/payments/initiate", {
        orderId,
        paymentMethod: data.paymentMethod,
        phoneNumber: data.phoneNumber,
      });
      return response.json();
    },
    onSuccess: (data: {
      success: boolean;
      message: string;
      paymentId: string;
      transactionId: string;
    }) => {
      if (data.success) {
        setIsProcessing(true);
        toast({
          title: "Paiement initié",
          description: data.message,
        });

        // Start polling for payment status
        pollPaymentStatus(data.paymentId, data.transactionId);
      } else {
        onPaymentError(data.message);
      }
    },
    onError: (error: Error) => {
      console.error("Payment initiation error:", error);
      onPaymentError(error.message || "Erreur lors du paiement");
    },
  });

  const pollPaymentStatus = async (paymentId: string, transactionId: string) => {
    const maxAttempts = 30; // 5 minutes max (10 second intervals)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const responseData = await apiRequest("GET", `/api/payments/${paymentId}/status`);
        const response: { status: string; failureReason?: string } = await responseData.json();

        if (response.status === "completed") {
          setIsProcessing(false);
          onPaymentSuccess(paymentId, transactionId);
          return;
        }

        if (response.status === "failed") {
          setIsProcessing(false);
          onPaymentError(response.failureReason || "Paiement échoué");
          return;
        }

        // Continue polling if still pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          setIsProcessing(false);
          onPaymentError("Délai d'attente dépassé. Vérifiez le statut manuellement.");
        }
      } catch (error) {
        console.error("Payment status check error:", error);
        setIsProcessing(false);
        onPaymentError("Erreur lors de la vérification du statut");
      }
    };

    setTimeout(checkStatus, 2000); // Initial delay of 2 seconds
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("fr-BF") + " CFA";
  };

  const onSubmit = (data: PaymentFormData) => {
    initiatePaymentMutation.mutate(data);
  };

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">Traitement du paiement...</h3>
          <p className="text-gray-600 mb-4">
            {paymentMethod === "orange_money" &&
              "Vérifiez votre téléphone pour confirmer le paiement Orange Money"}
            {paymentMethod === "moov_money" &&
              "Composez *155# pour confirmer le paiement Moov Money"}
          </p>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-700">
              <i className="fas fa-clock mr-2"></i>
              Le paiement expire dans 10 minutes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-credit-card mr-2 text-zaka-blue"></i>
          Choisir le mode de paiement
        </CardTitle>
        <div className="bg-zaka-light p-3 rounded-lg">
          <p className="text-lg font-bold text-zaka-dark">
            Total à payer: {formatAmount(totalAmount)}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Payment Method Selection */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode de paiement</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-4"
                    >
                      {/* Orange Money */}
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-orange-50 transition-colors">
                        <RadioGroupItem value="orange_money" id="orange_money" />
                        <Label htmlFor="orange_money" className="flex-1 cursor-pointer">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                              <i className="fas fa-mobile-alt text-white text-xl"></i>
                            </div>
                            <div>
                              <h4 className="font-semibold">Orange Money</h4>
                              <p className="text-sm text-gray-600">
                                Paiement sécurisé via Orange Money
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* Moov Money */}
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-blue-50 transition-colors">
                        <RadioGroupItem value="moov_money" id="moov_money" />
                        <Label htmlFor="moov_money" className="flex-1 cursor-pointer">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                              <i className="fas fa-mobile-alt text-white text-xl"></i>
                            </div>
                            <div>
                              <h4 className="font-semibold">Moov Money</h4>
                              <p className="text-sm text-gray-600">
                                Paiement sécurisé via Moov Money
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* Cash on Delivery */}
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-green-50 transition-colors">
                        <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                        <Label htmlFor="cash_on_delivery" className="flex-1 cursor-pointer">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                              <i className="fas fa-money-bill-wave text-white text-xl"></i>
                            </div>
                            <div>
                              <h4 className="font-semibold">Paiement à la livraison</h4>
                              <p className="text-sm text-gray-600">
                                Payez en espèces lors de la réception
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number Input for Mobile Money */}
            {(paymentMethod === "orange_money" || paymentMethod === "moov_money") && (
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Numéro de téléphone {paymentMethod === "orange_money" ? "Orange" : "Moov"}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+226 XX XX XX XX" {...field} className="text-lg" />
                    </FormControl>
                    <FormMessage />
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <i className="fas fa-info-circle mr-2"></i>
                        Assurez-vous que votre compte{" "}
                        {paymentMethod === "orange_money" ? "Orange Money" : "Moov Money"}
                        dispose du solde suffisant ({formatAmount(totalAmount)})
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Cash on Delivery Info */}
            {paymentMethod === "cash_on_delivery" && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  <i className="fas fa-info-circle mr-2"></i>
                  Paiement à la livraison
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Préparez le montant exact: {formatAmount(totalAmount)}</li>
                  <li>• Le livreur accepte uniquement les espèces</li>
                  <li>• Vérifiez votre commande avant de payer</li>
                </ul>
              </div>
            )}

            <Button
              type="submit"
              disabled={initiatePaymentMutation.isPending}
              className="w-full bg-zaka-orange hover:bg-zaka-orange text-white py-3 text-lg"
            >
              {initiatePaymentMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Traitement...
                </>
              ) : (
                <>
                  <i className="fas fa-lock mr-2"></i>
                  Confirmer le paiement
                </>
              )}
            </Button>

            <div className="text-center text-xs text-gray-500">
              <i className="fas fa-shield-alt text-green-500 mr-1"></i>
              Paiement sécurisé et chiffré
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
