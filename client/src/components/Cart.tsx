import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CheckoutForm from "./CheckoutForm";

interface CartProps {
  onClose: () => void;
}

export default function Cart({ onClose }: CartProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const { toast } = useToast();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ['/api/cart'],
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return await apiRequest('PATCH', `/api/cart/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être connecté",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le panier",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest('DELETE', `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Succès",
        description: "Article retiré du panier",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être connecté",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de retirer l'article",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "Succès",
        description: "Panier vidé",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être connecté",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de vider le panier",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((total: number, item: any) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  const calculateDeliveryFee = () => {
    return 2000; // Fixed delivery fee of 2000 CFA
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateDeliveryFee();
  };

  if (showCheckout) {
    return (
      <CheckoutForm 
        cartItems={cartItems || []}
        total={calculateGrandTotal()}
        onBack={() => setShowCheckout(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <i className="fas fa-shopping-cart mr-2"></i>
          Votre panier
          {cartItems && cartItems.length > 0 && (
            <Badge className="ml-2 bg-zaka-orange">{cartItems.length}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <i className="fas fa-times"></i>
        </Button>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full">
        {isLoading ? (
          <div className="space-y-4 flex-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border-b pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !cartItems || cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <i className="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Votre panier est vide
            </h3>
            <p className="text-gray-500 mb-4">
              Ajoutez des produits pour commencer vos achats
            </p>
            <Button onClick={onClose} className="bg-zaka-blue hover:bg-zaka-blue">
              Continuer les achats
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <i className="fas fa-image text-gray-400"></i>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-zaka-dark text-sm">{item.product.name}</h4>
                      <p className="text-xs text-zaka-gray">
                        {parseFloat(item.product.price).toLocaleString()} CFA x {item.quantity}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => updateCartMutation.mutate({ 
                            itemId: item.id, 
                            quantity: Math.max(1, item.quantity - 1) 
                          })}
                          disabled={item.quantity <= 1 || updateCartMutation.isPending}
                        >
                          <i className="fas fa-minus text-xs"></i>
                        </Button>
                        <span className="text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => updateCartMutation.mutate({ 
                            itemId: item.id, 
                            quantity: item.quantity + 1 
                          })}
                          disabled={updateCartMutation.isPending}
                        >
                          <i className="fas fa-plus text-xs"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-zaka-orange">
                      {(parseFloat(item.product.price) * item.quantity).toLocaleString()} CFA
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0 mt-1"
                      onClick={() => removeItemMutation.mutate(item.id)}
                      disabled={removeItemMutation.isPending}
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <Separator className="mb-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sous-total:</span>
                  <span>{calculateTotal().toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between text-zaka-gray">
                  <span>Frais de livraison:</span>
                  <span>{calculateDeliveryFee().toLocaleString()} CFA</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-zaka-orange">{calculateGrandTotal().toLocaleString()} CFA</span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => clearCartMutation.mutate()}
                  disabled={clearCartMutation.isPending}
                  className="flex-1"
                >
                  Vider
                </Button>
                <Button 
                  className="bg-zaka-green hover:bg-zaka-green flex-2"
                  onClick={() => setShowCheckout(true)}
                >
                  Commander
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
