import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ProductCard from "./ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface SimilarProductsProps {
  productId: string;
  limit?: number;
  title?: string;
  className?: string;
}

interface SimilarProductsResponse {
  products: any[];
  total: number;
  algorithm?: string;
  confidence?: number;
}

export default function SimilarProducts({
  productId,
  limit = 6,
  title = "Produits similaires",
  className = "",
}: SimilarProductsProps) {
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Fetch similar products
  const {
    data: similarProducts,
    isLoading,
    error,
  } = useQuery<SimilarProductsResponse>({
    queryKey: ["/api/products/similar", productId, limit],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/products/${productId}/similar?limit=${limit}`);
      return response.json();
    },
    enabled: !!productId,
  });

  // Scroll functions
  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 280; // Width of one product card + gap
    const newPosition =
      direction === "left"
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);

    container.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });
    setScrollPosition(newPosition);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setScrollPosition(container.scrollLeft);
    }
  };

  // Don't render if no products
  if (!isLoading && (!similarProducts?.products || similarProducts.products.length === 0)) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Découvrez des produits aux caractéristiques similaires
                </p>
                {similarProducts?.algorithm && (
                  <p className="text-xs text-gray-500 mt-1">
                    Algorithme: {similarProducts.algorithm}
                    {similarProducts.confidence &&
                      ` • Confiance: ${Math.round(similarProducts.confidence * 100)}%`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">Impossible de charger les produits similaires</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : (
            <div className="relative">
              {/* Scroll buttons */}
              {similarProducts && similarProducts.products.length > 4 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md"
                    onClick={() => scroll("left")}
                    disabled={scrollPosition === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md"
                    onClick={() => scroll("right")}
                    disabled={
                      scrollContainerRef.current
                        ? scrollPosition >=
                          scrollContainerRef.current.scrollWidth -
                            scrollContainerRef.current.clientWidth
                        : false
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Products scroll container */}
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onScroll={handleScroll}
              >
                {similarProducts?.products.map((product) => (
                  <div key={product.id} className="flex-none w-64">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
