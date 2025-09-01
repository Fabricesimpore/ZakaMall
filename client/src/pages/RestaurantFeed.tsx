import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Heart, Share2, MessageCircle, Play, Volume2, VolumeX, Plus, Minus, ShoppingCart } from "lucide-react";

interface RestaurantProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  videos: string[];
  images: string[];
  vendorName: string;
  vendorId: string;
  rating: string;
}

interface VideoPlayerProps {
  src: string;
  isActive: boolean;
  product: RestaurantProduct;
  onOrderClick: (product: RestaurantProduct) => void;
}

interface QuickOrderModalProps {
  product: RestaurantProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

function QuickOrderModal({ product, isOpen, onClose }: QuickOrderModalProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product selected");
      return await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setIsAdded(true);
      toast({
        title: "Succès",
        description: `${quantity} × ${product?.name} ajouté au panier`,
      });
      setTimeout(() => {
        setIsAdded(false);
        onClose();
        setQuantity(1);
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit au panier. Connectez-vous d'abord.",
        variant: "destructive",
      });
    },
  });

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Commander maintenant</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product info */}
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              {product.images && product.images[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-utensils text-gray-400"></i>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              <p className="text-lg font-bold text-zaka-orange mt-2">
                {parseFloat(product.price).toLocaleString()} CFA
              </p>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Quantité:</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
              <Button
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold text-zaka-orange">
                {(parseFloat(product.price) * quantity).toLocaleString()} CFA
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending}
              className={`flex-1 ${isAdded ? "bg-green-600 hover:bg-green-700" : "bg-zaka-orange hover:bg-zaka-orange/90"}`}
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
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ajouter au panier
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VideoPlayer({ src, isActive, product, onOrderClick }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 500) + 10);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Découvrez ${product.name} de ${product.vendorName}`,
          url: window.location.href,
        });
      } catch {
        console.log("Partage annulé");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Lien copié dans le presse-papier!");
    }
  };

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center">
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
          onClick={togglePlay}
        >
          <Play className="w-20 h-20 text-white opacity-80" />
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Right sidebar with actions */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6">
        {/* Like button */}
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={`bg-black bg-opacity-50 text-white hover:bg-opacity-70 ${
              liked ? "text-red-500" : ""
            }`}
          >
            <Heart className={`h-6 w-6 ${liked ? "fill-current" : ""}`} />
          </Button>
          <span className="text-white text-sm mt-1">{likesCount}</span>
        </div>

        {/* Comment button */}
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <span className="text-white text-sm mt-1">{Math.floor(Math.random() * 50) + 5}</span>
        </div>

        {/* Share button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
        >
          <Share2 className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
        <div className="text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-zaka-orange rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">{product.vendorName.charAt(0)}</span>
            </div>
            <div>
              <p className="font-semibold">{product.vendorName}</p>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star text-xs ${
                        i < parseFloat(product.rating) ? "text-yellow-400" : "text-gray-400"
                      }`}
                    ></i>
                  ))}
                </div>
                <span className="text-xs text-gray-300">({product.rating})</span>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-2">{product.name}</h3>
          <p className="text-sm text-gray-200 mb-3 line-clamp-2">{product.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-zaka-green text-white">
                {parseFloat(product.price).toLocaleString()} CFA
              </Badge>
              <Badge variant="outline" className="text-white border-white">
                🍽️ Restaurant
              </Badge>
            </div>

            <Button
              size="sm"
              className="bg-zaka-orange hover:bg-zaka-orange/90"
              onClick={() => onOrderClick(product)}
            >
              Commander
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<RestaurantProduct | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOrderClick = (product: RestaurantProduct) => {
    setSelectedProduct(product);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedProduct(null);
  };

  // Fetch restaurant products with videos
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery<RestaurantProduct[]>({
    queryKey: ["/api/products/restaurants"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products/restaurants");
      if (!response.ok) throw new Error("Failed to fetch restaurant products");
      return response.json();
    },
  });

  // Handle scroll/swipe for video navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      isDragging = false;

      const endY = e.changedTouches[0].clientY;
      const deltaY = startY - endY;
      const threshold = 50;

      if (deltaY > threshold && currentIndex < products.length - 1) {
        // Swipe up - next video
        setCurrentIndex((prev) => prev + 1);
      } else if (deltaY < -threshold && currentIndex > 0) {
        // Swipe down - previous video
        setCurrentIndex((prev) => prev - 1);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && currentIndex < products.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, products.length]);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement des vidéos...</p>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <i className="fas fa-utensils text-4xl mb-4 text-gray-400"></i>
          <h2 className="text-xl font-bold mb-2">Aucune vidéo disponible</h2>
          <p className="text-gray-400 mb-4">Les restaurants n'ont pas encore ajouté de vidéos.</p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-black" ref={containerRef}>
      <Navbar />

      {/* Video Feed */}
      <div className="relative h-full">
        {products.map((product, index) => (
          <div
            key={product.id}
            className={`absolute inset-0 transition-transform duration-300 ${
              index === currentIndex
                ? "translate-y-0"
                : index < currentIndex
                  ? "-translate-y-full"
                  : "translate-y-full"
            }`}
          >
            {product.videos && product.videos.length > 0 ? (
              <VideoPlayer
                src={product.videos[0]}
                isActive={index === currentIndex}
                product={product}
                onOrderClick={handleOrderClick}
              />
            ) : (
              // Fallback for products without videos - show image with overlay
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <i className="fas fa-utensils text-6xl text-gray-600"></i>
                  </div>
                )}

                {/* Same UI as video but without video controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-zaka-orange rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {product.vendorName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{product.vendorName}</p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-200 mb-3">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <Badge className="bg-zaka-green text-white">
                        {parseFloat(product.price).toLocaleString()} CFA
                      </Badge>
                      <Button
                        size="sm"
                        className="bg-zaka-orange hover:bg-zaka-orange/90"
                        onClick={() => handleOrderClick(product)}
                      >
                        Commander
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation indicators */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-gray-500"
            }`}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
        ↕️ Glissez pour naviguer
      </div>

      {/* Quick Order Modal */}
      <QuickOrderModal
        product={selectedProduct}
        isOpen={showOrderModal}
        onClose={closeOrderModal}
      />
    </div>
  );
}
