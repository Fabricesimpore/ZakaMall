import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import EnhancedReviewsList from "@/components/EnhancedReviewsList";
import SimilarProducts from "@/components/SimilarProducts";

interface ProductDetailModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  price: string;
  images: string[] | null;
  videos: string[] | null;
  quantity: number;
  rating: string;
  vendorId: string;
  vendorDisplayName?: string;
  vendorSlug?: string;
  vendor?: {
    businessName: string;
    businessPhone: string | null;
    storeName?: string;
    storeSlug?: string;
  };
}

export default function ProductDetailModal({
  productId,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Fetch product details
  const { data: product, isLoading } = useQuery<ProductDetails>({
    queryKey: [`/api/products/${productId}`],
    queryFn: async () => {
      if (!productId) throw new Error("No product ID");
      const response = await apiRequest("GET", `/api/products/${productId}`);
      return await response.json();
    },
    enabled: !!productId && isOpen,
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setIsAdded(false);
      setCurrentMediaIndex(0);
      setIsVideoPlaying(false);
    }
  }, [isOpen, productId]);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product data");
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
        description: `${quantity} × ${product?.name} ajouté au panier`,
      });
      setQuantity(1);
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

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith("/objects/")) {
      return imageUrl;
    }
    if (imageUrl.includes("cloudinary.com")) {
      const baseUrl = imageUrl.split("/upload/")[0] + "/upload/";
      const imagePath = imageUrl.split("/upload/")[1];
      return `${baseUrl}c_fill,w_800,h_600,q_auto,f_auto/${imagePath}`;
    }
    return imageUrl;
  };

  // Combine images and videos into a single media array
  const images = product?.images?.filter((img) => img) || [];
  const videos = product?.videos?.filter((vid) => vid) || [];
  const allMedia = [
    ...images.map((img) => ({ type: "image", url: img })),
    ...videos.map((vid) => ({ type: "video", url: vid })),
  ];
  const currentMedia = allMedia[currentMediaIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : product ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-zaka-dark">{product.name}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Détails du produit</TabsTrigger>
                <TabsTrigger value="reviews">Avis clients</TabsTrigger>
                <TabsTrigger value="similar">Produits similaires</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Media Gallery (Images + Videos) */}
                  <div className="space-y-4">
                    <div className="relative">
                      {currentMedia ? (
                        currentMedia.type === "video" ? (
                          <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
                            <video
                              src={currentMedia.url}
                              className="w-full h-full object-cover"
                              controls
                              loop
                              muted
                              playsInline
                              poster=""
                              onPlay={() => setIsVideoPlaying(true)}
                              onPause={() => setIsVideoPlaying(false)}
                              onEnded={() => setIsVideoPlaying(false)}
                            />
                            {!isVideoPlaying && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <div className="bg-white bg-opacity-20 rounded-full p-4">
                                  <i className="fas fa-play text-white text-2xl ml-1"></i>
                                </div>
                              </div>
                            )}
                            {/* Video badge */}
                            <Badge className="absolute top-4 left-4 bg-zaka-orange text-white">
                              <i className="fas fa-video mr-1"></i>
                              Vidéo
                            </Badge>
                          </div>
                        ) : (
                          <img
                            src={getImageUrl(currentMedia.url)}
                            alt={product.name}
                            className="w-full h-96 object-cover rounded-lg"
                          />
                        )
                      ) : (
                        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-image text-4xl text-gray-400"></i>
                        </div>
                      )}

                      {/* Stock badges */}
                      {product.quantity <= 5 && product.quantity > 0 && (
                        <Badge className="absolute top-4 right-4 bg-orange-500 text-white">
                          Stock faible
                        </Badge>
                      )}
                      {product.quantity === 0 && (
                        <Badge className="absolute top-4 right-4 bg-red-500 text-white">
                          Rupture
                        </Badge>
                      )}

                      {/* Media navigation */}
                      {allMedia.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={() =>
                              setCurrentMediaIndex((prev) =>
                                prev === 0 ? allMedia.length - 1 : prev - 1
                              )
                            }
                          >
                            <i className="fas fa-chevron-left"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                            onClick={() =>
                              setCurrentMediaIndex((prev) =>
                                prev === allMedia.length - 1 ? 0 : prev + 1
                              )
                            }
                          >
                            <i className="fas fa-chevron-right"></i>
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Media thumbnails */}
                    {allMedia.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {allMedia.map((media, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentMediaIndex(index)}
                            className={`relative flex-shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden ${
                              index === currentMediaIndex ? "border-zaka-blue" : "border-gray-200"
                            }`}
                          >
                            {media.type === "video" ? (
                              <>
                                <video
                                  src={media.url}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                  <i className="fas fa-play text-white text-xs"></i>
                                </div>
                              </>
                            ) : (
                              <img
                                src={getImageUrl(media.url)}
                                alt={`${product.name} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    {/* Price and Rating */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-3xl font-bold text-zaka-orange">
                          {formatPrice(product.price)} CFA
                        </span>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                        <i className="fas fa-star text-yellow-400 mr-1"></i>
                        <span className="text-sm font-medium">
                          {parseFloat(product.rating || "0").toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-zaka-dark mb-2">Description</h3>
                      <p className="text-zaka-gray leading-relaxed">{product.description}</p>
                    </div>

                    {/* Vendor Info */}
                    {(product.vendor || product.vendorDisplayName) && (
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-zaka-dark mb-2">Vendu par</h4>
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              {product.vendorSlug ? (
                                <a
                                  href={`/store/${product.vendorSlug}`}
                                  className="font-medium underline hover:no-underline text-zaka-orange"
                                >
                                  {product.vendorDisplayName ||
                                    product.vendor?.storeName ||
                                    product.vendor?.businessName}
                                </a>
                              ) : (
                                <span className="font-medium text-zaka-orange">
                                  {product.vendorDisplayName ||
                                    product.vendor?.storeName ||
                                    product.vendor?.businessName}
                                </span>
                              )}
                              {/* Optional verified badge if vendor is approved */}
                              <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                Vérifié
                              </span>
                            </div>
                            {product.vendor?.businessPhone && (
                              <Button variant="outline" size="sm">
                                <i className="fas fa-phone mr-2"></i>
                                Contacter
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Stock and Quantity */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zaka-gray">
                          Stock disponible: {product.quantity} unités
                        </span>
                      </div>

                      {product.quantity > 0 && (
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">Quantité:</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                            >
                              <i className="fas fa-minus text-sm"></i>
                            </Button>
                            <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                              disabled={quantity >= product.quantity}
                            >
                              <i className="fas fa-plus text-sm"></i>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <Button
                        className={`w-full py-3 text-lg transition-all ${
                          isAdded
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-zaka-blue hover:bg-zaka-blue"
                        } text-white`}
                        onClick={() => addToCartMutation.mutate()}
                        disabled={product.quantity === 0 || addToCartMutation.isPending}
                      >
                        {addToCartMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Ajout en cours...
                          </>
                        ) : isAdded ? (
                          <>
                            <i className="fas fa-check mr-2"></i>
                            Ajouté au panier!
                          </>
                        ) : (
                          <>
                            <i className="fas fa-cart-plus mr-2"></i>
                            {product.quantity === 0
                              ? "Produit en rupture"
                              : `Ajouter ${quantity} au panier`}
                          </>
                        )}
                      </Button>

                      {/* WhatsApp Support for out of stock */}
                      {product.quantity === 0 && (
                        <WhatsAppSupport
                          variant="compact"
                          productId={product.id}
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <EnhancedReviewsList
                  productId={product.id}
                  vendorId={product.vendorId}
                  vendorName={
                    product.vendorDisplayName ||
                    product.vendor?.storeName ||
                    product.vendor?.businessName
                  }
                />
              </TabsContent>

              <TabsContent value="similar" className="mt-6">
                <SimilarProducts productId={product.id} limit={8} />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <i className="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Produit introuvable</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
