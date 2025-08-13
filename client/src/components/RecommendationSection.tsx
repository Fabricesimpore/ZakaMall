import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import ProductCard from "./ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, Star, Clock } from "lucide-react";

interface RecommendationSectionProps {
  type?: "personalized" | "collaborative" | "trending" | "popular" | "newest";
  title?: string;
  description?: string;
  limit?: number;
  categoryId?: string;
  excludeProductIds?: string[];
  showViewAll?: boolean;
  className?: string;
}

interface RecommendationsResponse {
  products: any[];
  total: number;
  algorithm?: string;
  confidence?: number;
}

const RECOMMENDATION_CONFIGS = {
  personalized: {
    title: "Recommandé pour vous",
    description: "Basé sur vos préférences et votre historique",
    icon: Sparkles,
    color: "text-purple-600",
  },
  collaborative: {
    title: "Clients ayant des goûts similaires ont aussi aimé",
    description: "Découvrez ce que d'autres clients comme vous ont apprécié",
    icon: Star,
    color: "text-blue-600",
  },
  trending: {
    title: "Tendances du moment",
    description: "Les produits les plus populaires en ce moment",
    icon: TrendingUp,
    color: "text-green-600",
  },
  popular: {
    title: "Les plus populaires",
    description: "Les produits les mieux notés par notre communauté",
    icon: Star,
    color: "text-yellow-600",
  },
  newest: {
    title: "Nouveautés",
    description: "Les derniers produits ajoutés",
    icon: Clock,
    color: "text-indigo-600",
  },
};

export default function RecommendationSection({
  type = "personalized",
  title,
  description,
  limit = 8,
  categoryId,
  excludeProductIds = [],
  showViewAll = true,
  className = "",
}: RecommendationSectionProps) {
  const { user } = useAuth();
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const config = RECOMMENDATION_CONFIGS[type];
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const IconComponent = config.icon;

  // Fetch recommendations
  const {
    data: recommendations,
    isLoading,
    error,
  } = useQuery<RecommendationsResponse>({
    queryKey: ["/api/recommendations", type, user?.id, limit, categoryId, excludeProductIds],
    queryFn: async () => {
      const params = new URLSearchParams({
        type,
        limit: limit.toString(),
      });

      if (user?.id) {
        params.set("userId", user.id);
      }

      if (categoryId) {
        params.set("categoryId", categoryId);
      }

      if (excludeProductIds.length > 0) {
        params.set("excludeProductIds", excludeProductIds.join(","));
      }

      const response = await apiRequest("GET", `/api/recommendations?${params.toString()}`);
      return response.json();
    },
    enabled: true,
  });

  // Scroll functions
  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 320; // Width of one product card + gap
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
  if (!isLoading && (!recommendations?.products || recommendations.products.length === 0)) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-50 ${config.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{displayTitle}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{displayDescription}</p>
                {recommendations?.algorithm && (
                  <p className="text-xs text-gray-500 mt-1">
                    Algorithme: {recommendations.algorithm}
                    {recommendations.confidence &&
                      ` • Confiance: ${Math.round(recommendations.confidence * 100)}%`}
                  </p>
                )}
              </div>
            </div>

            {showViewAll && recommendations && recommendations.total > limit && (
              <Button variant="outline" size="sm">
                Voir tout ({recommendations.total})
              </Button>
            )}
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
              <p className="mb-2">Impossible de charger les recommandations</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          ) : (
            <div className="relative">
              {/* Scroll buttons */}
              {recommendations && recommendations.products.length > 4 && (
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
                {recommendations?.products.map((product) => (
                  <div key={product.id} className="flex-none w-72">
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
