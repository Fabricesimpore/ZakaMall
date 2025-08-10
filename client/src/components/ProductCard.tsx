import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: string;
    images: string[] | null;
    quantity: number;
    rating: string;
    vendorId: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
      toast({
        title: "Succès",
        description: `${quantity} × ${product.name} ajouté au panier`,
      });
      setQuantity(1); // Reset quantity after adding
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être connecté pour ajouter au panier",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit au panier",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string | number) => {
    return parseFloat(price.toString()).toLocaleString();
  };

  const getFirstImage = () => {
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0];
      // If it's an object storage path, convert to proper URL
      if (imageUrl.startsWith("/objects/")) {
        return imageUrl; // Will be served by our object storage route
      }
      return imageUrl;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative">
          {getFirstImage() ? (
            <img
              src={getFirstImage()!}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
              <i className="fas fa-image text-3xl text-gray-400"></i>
            </div>
          )}

          {product.quantity <= 5 && product.quantity > 0 && (
            <Badge className="absolute top-2 right-2 bg-orange-500 text-white">Stock faible</Badge>
          )}

          {product.quantity === 0 && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">Rupture</Badge>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-zaka-dark mb-2 line-clamp-2">{product.name}</h3>
          <p className="text-sm text-zaka-gray mb-3 line-clamp-2">{product.description}</p>

          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-bold text-zaka-orange">
              {formatPrice(product.price)} CFA
            </span>
            <div className="flex items-center">
              <i className="fas fa-star text-yellow-400 mr-1"></i>
              <span className="text-sm text-zaka-gray">
                {parseFloat(product.rating || "0").toFixed(1)}
              </span>
            </div>
          </div>

          {/* Stock info and Quick Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zaka-gray">Stock: {product.quantity}</span>
              {product.quantity > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    disabled={quantity <= 1}
                  >
                    <i className="fas fa-minus text-xs"></i>
                  </button>
                  <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    disabled={quantity >= product.quantity}
                  >
                    <i className="fas fa-plus text-xs"></i>
                  </button>
                </div>
              )}
            </div>

            <Button
              className={`w-full transition-all ${
                isAdded ? "bg-green-500 hover:bg-green-600" : "bg-zaka-blue hover:bg-zaka-blue"
              } text-white text-sm px-4 py-2`}
              onClick={() => addToCartMutation.mutate()}
              disabled={product.quantity === 0 || addToCartMutation.isPending}
            >
              {addToCartMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Ajout...
                </>
              ) : isAdded ? (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Ajouté!
                </>
              ) : (
                <>
                  <i className="fas fa-cart-plus mr-2"></i>
                  {product.quantity === 0 ? "Rupture" : `Ajouter (${quantity})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
