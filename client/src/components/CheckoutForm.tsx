import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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

const deliverySchema = z.object({
  deliveryAddress: z.object({
    fullName: z.string().min(1, "Le nom complet est requis"),
    phone: z.string().min(1, "Le numéro de téléphone est requis"),
    address: z.string().min(1, "L'adresse est requise"),
    city: z.string().min(1, "La ville est requise"),
    instructions: z.string().optional(),
  }),
});

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

  const form = useForm<z.infer<typeof deliverySchema>>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      deliveryAddress: {
        fullName: "",
        phone: "",
        address: "",
        city: "Ouagadougou",
        instructions: "",
      },
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Record<string, unknown>) => {
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Commande confirmée !",
        description:
          "Votre commande a été passée avec succès. Vous recevrez bientôt une confirmation.",
      });
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être connecté pour passer commande",
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
        const deliveryFee = 2000; // 2000 CFA per vendor
        const totalAmount = subtotal + deliveryFee;

        const orderData = {
          vendorId,
          subtotal: subtotal.toString(),
          deliveryFee: deliveryFee.toString(),
          totalAmount: totalAmount.toString(),
          deliveryAddress: JSON.stringify(values.deliveryAddress),
          deliveryInstructions: values.deliveryAddress.instructions,
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
          Finaliser la commande
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
              <span>Frais de livraison</span>
              <span>2,000 CFA</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{total.toLocaleString()} CFA</span>
            </div>
          </div>
        </div>

        {step === "delivery" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Delivery Address */}
              <div>
                <h3 className="font-semibold text-zaka-dark mb-4">Adresse de livraison</h3>
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
                  <FormField
                    control={form.control}
                    name="deliveryAddress.instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions spéciales</FormLabel>
                        <FormControl>
                          <Input placeholder="Points de repère, étage..." {...field} />
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
