import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CartItemWithProduct } from "@shared/schema";
import PaymentModal from "@/components/PaymentModal";

const deliverySchema = z
  .object({
    deliveryType: z.enum(["standard", "express", "pickup"]),
    deliveryAddress: z.object({
      fullName: z.string().min(1, "Le nom complet est requis"),
      phone: z.string().min(1, "Le numéro de téléphone est requis"),
      address: z.string().optional(),
      city: z.string().optional(),
      instructions: z.string().optional(),
    }),
    customerInfo: z
      .object({
        email: z.string().email("Email invalide").optional().or(z.literal("")),
        createAccount: z.boolean().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.deliveryType === "pickup") {
        return true; // For pickup, address and city are optional
      }
      return data.deliveryAddress.address && data.deliveryAddress.city;
    },
    {
      message: "L'adresse et la ville sont requises pour la livraison",
      path: ["deliveryAddress"],
    }
  );

interface CheckoutFormProps {
  cartItems: CartItemWithProduct[];
  total: number;
  onBack: () => void;
  onClose: () => void;
}

export default function CheckoutForm({ cartItems, total, onBack, onClose }: CheckoutFormProps) {
  const [step, setStep] = useState<"delivery" | "payment" | "success">("delivery");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Calculate delivery fee based on type
  const calculateDeliveryFee = (deliveryType: string) => {
    switch (deliveryType) {
      case "standard":
        return 2000; // 2000 CFA - 2-3 days
      case "express":
        return 3500; // 3500 CFA - Same day/next day
      case "pickup":
        return 0; // Free pickup
      default:
        return 2000;
    }
  };

  const form = useForm<z.infer<typeof deliverySchema>>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      deliveryType: "standard",
      deliveryAddress: {
        fullName: user?.firstName || "",
        phone: user?.phone || "",
        address: "",
        city: "Ouagadougou",
        instructions: "",
      },
      customerInfo: {
        email: user?.email || "",
        createAccount: false,
      },
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Record<string, unknown>) => {
      // For guest users, use a different endpoint or add guest flag
      const endpoint = isAuthenticated ? "/api/orders" : "/api/orders/guest";
      return await apiRequest("POST", endpoint, orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
      toast({
        title: "Commande confirmée !",
        description: isAuthenticated
          ? "Votre commande a été passée avec succès. Vous recevrez bientôt une confirmation."
          : "Votre commande a été passée avec succès. Un email de confirmation sera envoyé si fourni.",
      });
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error) && isAuthenticated) {
        toast({
          title: "Session expirée",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: z.infer<typeof deliverySchema>) => {
    try {
      // Group cart items by vendor
      const vendorGroups = cartItems.reduce(
        (groups: Record<string, unknown[]>, item: CartItemWithProduct) => {
          const vendorId = item.product.vendorId;
          if (!groups[vendorId]) {
            groups[vendorId] = [];
          }
          groups[vendorId].push(item);
          return groups;
        },
        {}
      );

      // Create separate orders for each vendor
      let firstOrderId = null;
      for (const [vendorId, items] of Object.entries(vendorGroups) as [
        string,
        CartItemWithProduct[],
      ][]) {
        const subtotal = items.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );
        const deliveryFee = calculateDeliveryFee(values.deliveryType);
        const totalAmount = subtotal + deliveryFee;

        const orderData = {
          vendorId,
          subtotal: subtotal.toString(),
          deliveryFee: deliveryFee.toString(),
          totalAmount: totalAmount.toString(),
          deliveryType: values.deliveryType,
          deliveryAddress: JSON.stringify(values.deliveryAddress),
          deliveryInstructions: values.deliveryAddress.instructions,
          ...(isAuthenticated
            ? {}
            : {
                guestEmail: values.customerInfo?.email,
                guestName: values.deliveryAddress.fullName,
                guestPhone: values.deliveryAddress.phone,
                createAccount: values.customerInfo?.createAccount || false,
              }),
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: (parseFloat(item.product.price) * item.quantity).toString(),
            productSnapshot: JSON.stringify(item.product),
          })),
        };

        const order = await createOrderMutation.mutateAsync(orderData);
        if (!firstOrderId) {
          firstOrderId = (order as any).id;
        }
      }

      setCreatedOrderId(firstOrderId);
      setShowPaymentModal(true);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setStep("success");
    queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <i className="fas fa-arrow-left"></i>
          </Button>
          <div className="flex flex-col">
            <span>Finaliser la commande</span>
            {!isAuthenticated && (
              <span className="text-sm font-normal text-gray-500">Commande invité</span>
            )}
          </div>
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <i className="fas fa-times"></i>
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-zaka-light rounded-lg p-4">
          <h3 className="font-semibold text-zaka-dark mb-3">Récapitulatif de commande</h3>
          <div className="space-y-2 text-sm">
            {cartItems.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.product.name} x{item.quantity}
                </span>
                <span>{(parseFloat(item.product.price) * item.quantity).toLocaleString()} CFA</span>
              </div>
            ))}
            <div className="flex justify-between text-zaka-gray">
              <span>
                {form.watch("deliveryType") === "pickup"
                  ? "Retrait"
                  : form.watch("deliveryType") === "express"
                    ? "Livraison express"
                    : "Livraison standard"}
              </span>
              <span
                className={
                  form.watch("deliveryType") === "pickup"
                    ? "text-zaka-green font-medium"
                    : form.watch("deliveryType") === "express"
                      ? "text-zaka-orange"
                      : ""
                }
              >
                {form.watch("deliveryType") === "pickup"
                  ? "Gratuit"
                  : `${calculateDeliveryFee(form.watch("deliveryType")).toLocaleString()} CFA`}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-zaka-orange">
                {(
                  cartItems.reduce(
                    (sum: number, item: any) =>
                      sum + parseFloat(item.product.price) * item.quantity,
                    0
                  ) + calculateDeliveryFee(form.watch("deliveryType"))
                ).toLocaleString()}{" "}
                CFA
              </span>
            </div>
          </div>
        </div>

        {step === "delivery" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Guest Information */}
              {!isAuthenticated && (
                <div>
                  <h3 className="font-semibold text-zaka-dark mb-4">Informations client</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                        <p className="text-sm text-blue-700">
                          Vous passez commande en tant qu'invité.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = "/api/login")}
                        className="text-blue-600 border-blue-300 hover:bg-blue-100"
                      >
                        Se connecter
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerInfo.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (optionnel)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemple.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerInfo.createAccount"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 text-zaka-blue focus:ring-zaka-blue border-gray-300 rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Créer un compte avec ces informations
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Delivery Options */}
              <div>
                <h3 className="font-semibold text-zaka-dark mb-4">Options de livraison</h3>
                <FormField
                  control={form.control}
                  name="deliveryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          <div
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              field.value === "standard"
                                ? "border-zaka-blue bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => field.onChange("standard")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  checked={field.value === "standard"}
                                  onChange={() => field.onChange("standard")}
                                  className="h-4 w-4 text-zaka-blue focus:ring-zaka-blue border-gray-300"
                                />
                                <div className="ml-3">
                                  <h4 className="font-medium text-zaka-dark">Livraison standard</h4>
                                  <p className="text-sm text-gray-600">2-3 jours ouvrables</p>
                                </div>
                              </div>
                              <span className="font-semibold text-zaka-dark">2,000 CFA</span>
                            </div>
                          </div>

                          <div
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              field.value === "express"
                                ? "border-zaka-orange bg-orange-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => field.onChange("express")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  checked={field.value === "express"}
                                  onChange={() => field.onChange("express")}
                                  className="h-4 w-4 text-zaka-orange focus:ring-zaka-orange border-gray-300"
                                />
                                <div className="ml-3">
                                  <h4 className="font-medium text-zaka-dark">Livraison express</h4>
                                  <p className="text-sm text-gray-600">Le jour même ou lendemain</p>
                                </div>
                              </div>
                              <span className="font-semibold text-zaka-orange">3,500 CFA</span>
                            </div>
                          </div>

                          <div
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              field.value === "pickup"
                                ? "border-zaka-green bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => field.onChange("pickup")}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  checked={field.value === "pickup"}
                                  onChange={() => field.onChange("pickup")}
                                  className="h-4 w-4 text-zaka-green focus:ring-zaka-green border-gray-300"
                                />
                                <div className="ml-3">
                                  <h4 className="font-medium text-zaka-dark">Retrait en magasin</h4>
                                  <p className="text-sm text-gray-600">Retirer chez le vendeur</p>
                                </div>
                              </div>
                              <span className="font-semibold text-zaka-green">Gratuit</span>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="font-semibold text-zaka-dark mb-4">
                  {form.watch("deliveryType") === "pickup"
                    ? "Informations de contact"
                    : "Adresse de livraison"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryAddress.fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre nom complet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryAddress.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="70 XX XX XX XX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("deliveryType") !== "pickup" && (
                    <>
                      <FormField
                        control={form.control}
                        name="deliveryAddress.address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Adresse</FormLabel>
                            <FormControl>
                              <Input placeholder="Secteur, quartier, rue" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryAddress.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Ouagadougou">Ouagadougou</SelectItem>
                                <SelectItem value="Bobo-Dioulasso">Bobo-Dioulasso</SelectItem>
                                <SelectItem value="Koudougou">Koudougou</SelectItem>
                                <SelectItem value="Banfora">Banfora</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  <FormField
                    control={form.control}
                    name="deliveryAddress.instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("deliveryType") === "pickup"
                            ? "Instructions de retrait"
                            : "Instructions spéciales"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              form.watch("deliveryType") === "pickup"
                                ? "Heure préférée, instructions..."
                                : "Points de repère, étage..."
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-zaka-green hover:bg-zaka-green text-white py-4 text-lg font-semibold"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Création de la commande...
                  </>
                ) : (
                  "Continuer vers le paiement"
                )}
              </Button>

              <p className="text-center text-sm text-zaka-gray">
                En continuant, vous acceptez nos conditions d'utilisation
              </p>
            </form>
          </Form>
        )}

        {step === "payment" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-credit-card text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-xl font-semibold text-zaka-dark mb-2">Commande créée</h3>
            <p className="text-zaka-gray mb-6">
              Votre commande a été créée avec succès. Cliquez sur "Procéder au paiement" pour
              finaliser.
            </p>
            <Button
              onClick={() => setShowPaymentModal(true)}
              className="bg-zaka-orange hover:bg-zaka-orange/90 text-white"
            >
              <i className="fas fa-credit-card mr-2"></i>
              Procéder au paiement
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-2xl text-green-600"></i>
            </div>
            <h3 className="text-xl font-semibold text-zaka-dark mb-2">Commande confirmée !</h3>
            <p className="text-zaka-gray mb-6">
              Votre commande a été passée avec succès et le paiement confirmé.
            </p>
            <Button onClick={onClose} className="bg-zaka-green hover:bg-zaka-green text-white">
              Fermer
            </Button>
          </div>
        )}

        {/* Payment Modal */}
        {createdOrderId && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            orderId={createdOrderId}
            totalAmount={total}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </CardContent>
    </Card>
  );
}
