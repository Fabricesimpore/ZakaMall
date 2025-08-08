import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const checkoutSchema = z.object({
  paymentMethod: z.enum(['orange_money', 'moov_money', 'cash_on_delivery']),
  deliveryAddress: z.object({
    fullName: z.string().min(1, "Le nom complet est requis"),
    phone: z.string().min(1, "Le numéro de téléphone est requis"),
    address: z.string().min(1, "L'adresse est requise"),
    city: z.string().min(1, "La ville est requise"),
    instructions: z.string().optional(),
  }),
  orangeMoneyPhone: z.string().optional(),
  orangeMoneyPin: z.string().optional(),
});

interface CheckoutFormProps {
  cartItems: any[];
  total: number;
  onBack: () => void;
  onClose: () => void;
}

export default function CheckoutForm({ cartItems, total, onBack, onClose }: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'orange_money',
      deliveryAddress: {
        fullName: "",
        phone: "",
        address: "",
        city: "Ouagadougou",
        instructions: "",
      },
      orangeMoneyPhone: "",
      orangeMoneyPin: "",
    },
  });

  const paymentMethod = form.watch('paymentMethod');

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Commande confirmée !",
        description: "Votre commande a été passée avec succès. Vous recevrez bientôt une confirmation.",
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

  const onSubmit = async (values: z.infer<typeof checkoutSchema>) => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Group cart items by vendor
      const vendorGroups = cartItems.reduce((groups: any, item: any) => {
        const vendorId = item.product.vendorId;
        if (!groups[vendorId]) {
          groups[vendorId] = [];
        }
        groups[vendorId].push(item);
        return groups;
      }, {});

      // Create separate orders for each vendor
      for (const [vendorId, items] of Object.entries(vendorGroups) as [string, any[]][]) {
        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
        const deliveryFee = 2000; // 2000 CFA per vendor
        const totalAmount = subtotal + deliveryFee;

        const orderData = {
          vendorId,
          subtotal: subtotal.toString(),
          deliveryFee: deliveryFee.toString(),
          totalAmount: totalAmount.toString(),
          paymentMethod: values.paymentMethod,
          paymentStatus: values.paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed',
          deliveryAddress: JSON.stringify(values.deliveryAddress),
          deliveryInstructions: values.deliveryAddress.instructions,
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: (parseFloat(item.product.price) * item.quantity).toString(),
            productSnapshot: JSON.stringify(item.product),
          })),
        };

        await createOrderMutation.mutateAsync(orderData);
      }
      
      toast({
        title: "Paiement réussi !",
        description: `Paiement de ${total.toLocaleString()} CFA effectué avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: "Le paiement a échoué. Veuillez vérifier vos informations.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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
                <span>{item.product.name} x{item.quantity}</span>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Payment Method */}
            <div>
              <h3 className="font-semibold text-zaka-dark mb-4">Méthode de paiement</h3>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-3 p-4 border-2 border-zaka-orange rounded-lg">
                          <RadioGroupItem value="orange_money" id="orange_money" />
                          <div className="flex items-center flex-1">
                            <div className="w-12 h-8 bg-orange-500 rounded mr-3 flex items-center justify-center">
                              <span className="text-white font-bold text-xs">OM</span>
                            </div>
                            <div>
                              <Label htmlFor="orange_money" className="font-medium">Orange Money</Label>
                              <p className="text-sm text-zaka-gray">Paiement mobile sécurisé</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg">
                          <RadioGroupItem value="moov_money" id="moov_money" />
                          <div className="flex items-center flex-1">
                            <div className="w-12 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
                              <span className="text-white font-bold text-xs">MM</span>
                            </div>
                            <div>
                              <Label htmlFor="moov_money" className="font-medium">Moov Money</Label>
                              <p className="text-sm text-zaka-gray">Transfert d'argent mobile</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg">
                          <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                          <div className="flex items-center flex-1">
                            <div className="w-12 h-8 bg-zaka-green rounded mr-3 flex items-center justify-center">
                              <i className="fas fa-money-bill text-white"></i>
                            </div>
                            <div>
                              <Label htmlFor="cash_on_delivery" className="font-medium">Paiement à la livraison</Label>
                              <p className="text-sm text-zaka-gray">Espèces à la réception</p>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Orange Money Details */}
            {paymentMethod === 'orange_money' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-zaka-dark mb-3">Détails Orange Money</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="orangeMoneyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="70 XX XX XX XX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orangeMoneyPin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code PIN</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="****" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

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
              disabled={isProcessing || createOrderMutation.isPending}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Traitement du paiement...
                </>
              ) : (
                `Confirmer la commande - ${total.toLocaleString()} CFA`
              )}
            </Button>
            
            <p className="text-center text-sm text-zaka-gray">
              En confirmant, vous acceptez nos conditions d'utilisation
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
