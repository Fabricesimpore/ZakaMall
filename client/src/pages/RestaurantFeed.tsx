import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Share2,
  MessageCircle,
  Play,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  Search,
  Filter,
  X,
  Mic,
  Clock,
  TrendingUp,
  Star,
} from "lucide-react";
import "@/styles/video-feed.css";

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
  categories?: string[];
  location?: string;
}

interface SearchFilters {
  query: string;
  categories: string[];
  priceRange: [number, number];
  minRating: number;
  hasVideo: boolean;
  location?: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: "recent" | "trending" | "category" | "restaurant";
  count?: number;
}

interface VideoPlayerProps {
  src: string;
  isActive: boolean;
  product: RestaurantProduct;
  onOrderClick: (product: RestaurantProduct) => void;
  onQuickAdd?: (product: RestaurantProduct, quantity: number) => void;
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
            <Button variant="outline" onClick={onClose} className="flex-1">
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

function VideoPlayer({ src, isActive, product, onOrderClick, onQuickAdd }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 500) + 10);
  const [quickQuantity, setQuickQuantity] = useState(1);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [videoOrientation, setVideoOrientation] = useState<
    "portrait" | "landscape" | "square" | "loading"
  >("loading");

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

  // Detect video orientation when metadata loads
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      const aspectRatio = videoWidth / videoHeight;

      if (aspectRatio > 1.3) {
        setVideoOrientation("landscape");
      } else if (aspectRatio < 0.75) {
        setVideoOrientation("portrait");
      } else {
        setVideoOrientation("square");
      }
    }
  };

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

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap <= DOUBLE_TAP_DELAY) {
      // Double tap detected - quick add 1 item
      if (onQuickAdd) {
        onQuickAdd(product, 1);
      }
    } else {
      // Single tap - toggle play
      togglePlay();
    }

    setLastTap(now);
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

  const handleQuickAdd = async () => {
    if (!onQuickAdd) return;
    setIsAdding(true);
    try {
      await onQuickAdd(product, quickQuantity);
      setIsAdding(false);
      setShowQuickAdd(false);
      setQuickQuantity(1);
    } catch (error) {
      setIsAdding(false);
    }
  };

  return (
    <div className="video-container">
      {/* Loading indicator */}
      {videoOrientation === "loading" && (
        <div className="absolute inset-0 video-loading flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm">Chargement...</p>
          </div>
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className={`video-transition ${
          videoOrientation === "portrait"
            ? "video-portrait"
            : videoOrientation === "landscape"
              ? "video-landscape"
              : videoOrientation === "square"
                ? "video-square"
                : "w-full h-full object-cover"
        }`}
        loop
        muted={isMuted}
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        onClick={handleDoubleTap}
        onLoadedMetadata={handleVideoLoadedMetadata}
        onError={() => setVideoOrientation("square")}
        style={{
          opacity: videoOrientation === "loading" ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
          onClick={handleDoubleTap}
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
      <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-50 right-sidebar-actions">
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

        {/* Quick Add to Cart - Made more prominent */}
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="bg-zaka-orange hover:bg-zaka-orange/90 text-white border-2 border-white shadow-xl ring-4 ring-zaka-orange/40 w-16 h-16 rounded-full pulse-animation"
          >
            <ShoppingCart className="h-8 w-8" />
          </Button>
          <span className="text-white text-xs mt-1 font-bold bg-zaka-orange/90 px-3 py-1 rounded-full shadow-lg">
            AJOUTER
          </span>
        </div>
      </div>

      {/* Quick Add Overlay */}
      {showQuickAdd && (
        <div className="absolute right-4 bottom-80 bg-black bg-opacity-90 rounded-2xl p-4 border border-white/20">
          <div className="text-white text-center">
            <p className="text-sm font-medium mb-3">Ajouter au panier</p>

            {/* Quantity selector */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/20 text-white hover:bg-white/30"
                onClick={() => setQuickQuantity(Math.max(1, quickQuantity - 1))}
                disabled={quickQuantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold w-8 text-center">{quickQuantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/20 text-white hover:bg-white/30"
                onClick={() => setQuickQuantity(quickQuantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Price */}
            <p className="text-zaka-orange font-bold mb-3">
              {(parseFloat(product.price) * quickQuantity).toLocaleString()} CFA
            </p>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickAdd(false)}
                className="text-white border border-white/30 hover:bg-white/10"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="bg-zaka-orange hover:bg-zaka-orange/90 text-white"
              >
                {isAdding ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    <span className="text-xs">Ajout...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    <span className="text-xs">Confirmer</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

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
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<RestaurantProduct | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    categories: [],
    priceRange: [0, 50000],
    minRating: 0,
    hasVideo: true,
  });
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isVoiceSearch, setIsVoiceSearch] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<RestaurantProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleOrderClick = (product: RestaurantProduct) => {
    setSelectedProduct(product);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedProduct(null);
  };

  // Quick add mutation
  const quickAddMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return await apiRequest("POST", "/api/cart", {
        productId,
        quantity,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setCartItemCount((prev) => prev + variables.quantity);
      toast({
        title: "✅ Ajouté au panier!",
        description: `${variables.quantity} article(s) ajouté(s)`,
        duration: 2000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: "Connectez-vous pour ajouter au panier",
        variant: "destructive",
      });
    },
  });

  const handleQuickAdd = async (product: RestaurantProduct, quantity: number) => {
    await quickAddMutation.mutateAsync({ productId: product.id, quantity });
  };

  // Search functionality
  const performSearch = async (filters: SearchFilters) => {
    setIsSearching(true);
    try {
      // Filter products based on search criteria
      const filtered = products.filter((product) => {
        const matchesQuery =
          !filters.query ||
          product.name.toLowerCase().includes(filters.query.toLowerCase()) ||
          product.description.toLowerCase().includes(filters.query.toLowerCase()) ||
          product.vendorName.toLowerCase().includes(filters.query.toLowerCase());

        const matchesPrice =
          parseFloat(product.price) >= filters.priceRange[0] &&
          parseFloat(product.price) <= filters.priceRange[1];

        const matchesRating = parseFloat(product.rating || "0") >= filters.minRating;

        const hasVideoContent = filters.hasVideo
          ? product.videos && product.videos.length > 0
          : true;

        return matchesQuery && matchesPrice && matchesRating && hasVideoContent;
      });

      setFilteredProducts(filtered);

      // Add to search history if query exists
      if (filters.query.trim()) {
        const newSuggestion: SearchSuggestion = {
          id: Date.now().toString(),
          text: filters.query,
          type: "recent",
        };
        setSearchSuggestions((prev) => [
          newSuggestion,
          ...prev.filter((s) => s.text !== filters.query).slice(0, 4),
        ]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible d'effectuer la recherche",
        variant: "destructive",
      });
    }
    setIsSearching(false);
  };

  // Voice search functionality
  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "Fonction non supportée",
        description: "La recherche vocale n'est pas supportée par votre navigateur",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsVoiceSearch(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchFilters((prev) => ({ ...prev, query: transcript }));
      performSearch({ ...searchFilters, query: transcript });
      setIsVoiceSearch(false);
    };

    recognition.onerror = () => {
      setIsVoiceSearch(false);
      toast({
        title: "Erreur de reconnaissance vocale",
        description: "Impossible de reconnaître votre voix",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsVoiceSearch(false);
    };

    recognition.start();
  };

  // Get trending searches and categories
  const getTrendingSuggestions = (): SearchSuggestion[] => {
    const trending = [
      { id: "1", text: "Pizza", type: "trending" as const, count: 45 },
      { id: "2", text: "Burger", type: "trending" as const, count: 38 },
      { id: "3", text: "Sushi", type: "trending" as const, count: 29 },
      { id: "4", text: "Tacos", type: "trending" as const, count: 24 },
      { id: "5", text: "Poulet grillé", type: "trending" as const, count: 20 },
    ];

    const categories = [
      { id: "cat1", text: "Restauration rapide", type: "category" as const },
      { id: "cat2", text: "Cuisine africaine", type: "category" as const },
      { id: "cat3", text: "Desserts", type: "category" as const },
      { id: "cat4", text: "Boissons", type: "category" as const },
    ];

    return [...trending, ...categories];
  };

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchFilters((prev) => ({ ...prev, query }));
    if (query.length > 2) {
      performSearch({ ...searchFilters, query });
    } else if (query.length === 0) {
      setFilteredProducts([]);
    }
  };

  // Fetch restaurant products with videos
  const {
    data: products = [],
    isLoading,
    error: fetchError,
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

      if (deltaY > threshold && currentIndex < displayProducts.length - 1) {
        // Swipe up - next video
        setCurrentIndex((prev) => prev + 1);
      } else if (deltaY < -threshold && currentIndex > 0) {
        // Swipe down - previous video
        setCurrentIndex((prev) => prev - 1);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && currentIndex < displayProducts.length - 1) {
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

  // Get current products to display (filtered or all)
  const displayProducts =
    filteredProducts.length > 0 || searchFilters.query ? filteredProducts : products;

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

  if (fetchError || (products.length === 0 && !searchFilters.query)) {
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
    <div
      className="h-screen overflow-hidden bg-black relative video-feed-container"
      ref={containerRef}
    >
      <Navbar />

      {/* Search Button - Top Right */}
      {!showSearch && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearch(true)}
          className="absolute top-4 right-16 z-50 bg-black/50 text-white hover:bg-black/70 rounded-full"
        >
          <Search className="h-5 w-5" />
        </Button>
      )}

      {/* Enhanced Search Overlay */}
      {showSearch && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSearch(false);
                  setFilteredProducts([]);
                  setSearchFilters((prev) => ({ ...prev, query: "" }));
                }}
                className="text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Chercher de la nourriture..."
                  value={searchFilters.query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-zaka-orange"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zaka-orange"></div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={startVoiceSearch}
                disabled={isVoiceSearch}
                className={`text-white hover:bg-gray-800 ${isVoiceSearch ? "text-zaka-orange animate-pulse" : ""}`}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* No search query - Show suggestions */}
            {!searchFilters.query && (
              <div className="space-y-6">
                {/* Recent Searches */}
                {searchSuggestions.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Recherches récentes
                    </h3>
                    <div className="space-y-2">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSearchChange(suggestion.text)}
                          className="flex items-center justify-between w-full p-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-white text-left"
                        >
                          <span>{suggestion.text}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchSuggestions((prev) =>
                                prev.filter((s) => s.id !== suggestion.id)
                              );
                            }}
                            className="h-8 w-8 text-gray-400 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Tendances
                  </h3>
                  <div className="space-y-2">
                    {getTrendingSuggestions()
                      .filter((s) => s.type === "trending")
                      .map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSearchChange(suggestion.text)}
                          className="flex items-center justify-between w-full p-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-white text-left"
                        >
                          <span>{suggestion.text}</span>
                          {suggestion.count && (
                            <Badge className="bg-zaka-orange text-white">{suggestion.count}</Badge>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Catégories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {getTrendingSuggestions()
                      .filter((s) => s.type === "category")
                      .map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleSearchChange(category.text)}
                          className="p-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-white text-center"
                        >
                          {category.text}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Advanced Filters */}
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres avancés
                  </h3>
                  <div className="space-y-4 bg-gray-900 p-4 rounded-lg">
                    {/* Price Range */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Prix (CFA)</label>
                      <Slider
                        value={searchFilters.priceRange}
                        onValueChange={(value) =>
                          setSearchFilters((prev) => ({
                            ...prev,
                            priceRange: value as [number, number],
                          }))
                        }
                        min={0}
                        max={50000}
                        step={500}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{searchFilters.priceRange[0].toLocaleString()} CFA</span>
                        <span>{searchFilters.priceRange[1].toLocaleString()} CFA</span>
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Note minimum</label>
                      <div className="flex gap-2">
                        {[0, 3, 4, 4.5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() =>
                              setSearchFilters((prev) => ({ ...prev, minRating: rating }))
                            }
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
                              searchFilters.minRating === rating
                                ? "bg-zaka-orange text-white"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                          >
                            <Star className="h-3 w-3" />
                            <span>{rating === 0 ? "Toutes" : rating}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Video Filter */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-video"
                        checked={searchFilters.hasVideo}
                        onCheckedChange={(checked) =>
                          setSearchFilters((prev) => ({ ...prev, hasVideo: !!checked }))
                        }
                      />
                      <label htmlFor="has-video" className="text-sm text-gray-300">
                        Avec vidéo uniquement
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchFilters.query && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">
                    {filteredProducts.length} résultat{filteredProducts.length !== 1 ? "s" : ""}
                    {searchFilters.query && ` pour "${searchFilters.query}"`}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSearch(false);
                      setCurrentIndex(0); // Start from first filtered result
                    }}
                    disabled={filteredProducts.length === 0}
                    className="text-white border-gray-600 hover:bg-gray-800"
                  >
                    Voir les vidéos
                  </Button>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                    <h4 className="text-white font-semibold mb-2">Aucun résultat trouvé</h4>
                    <p className="text-gray-400 mb-4">
                      Essayez avec d'autres mots-clés ou modifiez vos filtres
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setCurrentIndex(displayProducts.indexOf(product));
                          setShowSearch(false);
                        }}
                        className="bg-gray-900 hover:bg-gray-800 rounded-lg overflow-hidden text-left"
                      >
                        <div className="aspect-video relative">
                          {product.videos && product.videos[0] ? (
                            <video
                              src={product.videos[0]}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <i className="fas fa-utensils text-gray-600 text-2xl"></i>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-white font-medium text-sm line-clamp-1">
                            {product.name}
                          </h4>
                          <p className="text-gray-400 text-xs line-clamp-1">{product.vendorName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-zaka-orange text-sm font-bold">
                              {parseFloat(product.price).toLocaleString()} CFA
                            </span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-1" />
                              <span className="text-xs text-gray-300">{product.rating}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Feed */}
      <div className="relative h-full">
        {displayProducts.map((product, index) => (
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
                onQuickAdd={handleQuickAdd}
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
        {displayProducts.map((_, index) => (
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

      {/* Double tap instruction */}
      <div className="absolute bottom-4 left-4 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded-full">
        ❤️ Double-tap pour acheter
      </div>

      {/* Floating Cart Indicator */}
      {cartItemCount > 0 && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            size="icon"
            onClick={() => (window.location.href = "/cart")}
            className="bg-zaka-orange hover:bg-zaka-orange/90 relative animate-bounce"
          >
            <ShoppingCart className="h-5 w-5 text-white" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {cartItemCount}
            </span>
          </Button>
        </div>
      )}

      {/* Success Animation */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {quickAddMutation.isSuccess && (
          <div className="bg-green-500 text-white rounded-full p-4 animate-ping">
            <Check className="h-8 w-8" />
          </div>
        )}
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
