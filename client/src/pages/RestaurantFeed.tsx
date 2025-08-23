import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MessageCircle, Play, Pause, Volume2, VolumeX } from "lucide-react";

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
}

function VideoPlayer({ src, isActive, product }: VideoPlayerProps) {
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
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Découvrez ${product.name} de ${product.vendorName}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier!');
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
              liked ? 'text-red-500' : ''
            }`}
          >
            <Heart className={`h-6 w-6 ${liked ? 'fill-current' : ''}`} />
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
              <span className="text-sm font-bold text-white">
                {product.vendorName.charAt(0)}
              </span>
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
              onClick={() => window.open(`/store/${product.vendorId}`, '_blank')}
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch restaurant products with videos
  const { data: products = [], isLoading, error } = useQuery<RestaurantProduct[]>({
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
        setCurrentIndex(prev => prev + 1);
      } else if (deltaY < -threshold && currentIndex > 0) {
        // Swipe down - previous video
        setCurrentIndex(prev => prev - 1);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < products.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
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
            onClick={() => window.location.href = '/'}
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
              index === currentIndex ? 'translate-y-0' : 
              index < currentIndex ? '-translate-y-full' : 'translate-y-full'
            }`}
          >
            {product.videos && product.videos.length > 0 ? (
              <VideoPlayer 
                src={product.videos[0]} 
                isActive={index === currentIndex}
                product={product}
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
                        onClick={() => window.open(`/store/${product.vendorId}`, '_blank')}
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
              index === currentIndex ? 'bg-white' : 'bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
        ↕️ Glissez pour naviguer
      </div>
    </div>
  );
}