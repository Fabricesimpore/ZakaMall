import { useState, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import ProductSearch from "@/components/ProductSearch";
import RecentlyViewed from "@/components/RecentlyViewed";
import RecommendationSection from "@/components/RecommendationSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CustomerDashboard() {
  const { isLoading: authLoading } = useAuth();
  const { trackSearch } = useSearchAnalytics();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000000,
    inStock: false,
    sortBy: "createdAt",
    sortOrder: "desc",
    minRating: 0,
    availability: "all",
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["/api/products", searchTerm, selectedCategory, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (filters.minPrice > 0) params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice < 1000000) params.append("maxPrice", filters.maxPrice.toString());
      if (filters.inStock) params.append("inStock", "true");
      if (filters.minRating > 0) params.append("minRating", filters.minRating.toString());
      params.append("sortBy", filters.sortBy);
      params.append("sortOrder", filters.sortOrder);
      params.append("page", pageParam.toString());
      params.append("limit", "20");
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok)
        throw new Error(`Erreur ${response.status}: Impossible de charger les produits`);
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const products = productsData?.pages.flatMap((page) => page.items) || [];

  // Track search analytics
  useEffect(() => {
    if (searchTerm.trim().length > 2) {
      const timer = setTimeout(() => {
        trackSearch({
          query: searchTerm,
          timestamp: Date.now(),
          resultsCount: productsData?.pages[0]?.total || 0,
          filters: {
            category: selectedCategory,
            ...filters,
          },
        });
      }, 1000); // Track after 1 second of no typing

      return () => clearTimeout(timer);
    }
  }, [searchTerm, selectedCategory, filters, productsData, trackSearch]);

  const { data: cartItems = [] } = useQuery<any[]>({
    queryKey: ["/api/cart"],
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zaka-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-zaka-dark mb-4 md:mb-0">Marketplace</h1>
          <Button
            onClick={() => setLocation("/cart")}
            className="bg-zaka-orange hover:bg-zaka-orange relative"
          >
            <i className="fas fa-shopping-cart mr-2"></i>
            Panier
            {cartItems && cartItems.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                {cartItems.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Product Search */}
        <ProductSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Recently Viewed Products */}
        <RecentlyViewed />

        {/* Recommendation Sections */}
        {!searchTerm && (
          <div className="space-y-8 mb-12">
            <RecommendationSection type="personalized" limit={8} />
            <RecommendationSection type="trending" limit={6} />
            <RecommendationSection type="popular" limit={6} />
          </div>
        )}

        {/* Categories */}
        {categoriesError ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-8">
            <p className="text-red-600 text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              Erreur de chargement des catégories: {categoriesError.message}
            </p>
          </div>
        ) : !categoriesLoading && categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {(() => {
              // Prioritize restaurant category and show first 4
              const restaurantCategory = categories.find((cat: any) => cat.id === "restaurant");
              const otherCategories = categories.filter((cat: any) => cat.id !== "restaurant");
              const displayCategories = restaurantCategory
                ? [restaurantCategory, ...otherCategories].slice(0, 4)
                : categories.slice(0, 4);

              return displayCategories.map((category: any) => (
                <div
                  key={category.id}
                  className={`p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer text-center ${
                    category.id === "restaurant"
                      ? "bg-gradient-to-br from-orange-500 to-red-600 text-white"
                      : "bg-white"
                  }`}
                  onClick={() => {
                    if (category.id === "restaurant") {
                      window.location.href = "/restaurants";
                    } else {
                      setSelectedCategory(category.id);
                    }
                  }}
                >
                  <i
                    className={`fas fa-${category.icon || "cube"} text-3xl mb-3 ${
                      category.id === "restaurant" ? "text-white" : "text-zaka-blue"
                    }`}
                  ></i>
                  <p
                    className={`font-medium ${
                      category.id === "restaurant" ? "text-white" : "text-zaka-dark"
                    }`}
                  >
                    {category.name}
                  </p>
                </div>
              ));
            })()}
          </div>
        ) : categoriesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex gap-8">
          {/* Products Grid */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-zaka-dark mb-6">
              {searchTerm ? `Résultats pour "${searchTerm}"` : "Produits populaires"}
            </h2>

            {productsError ? (
              <div className="text-center py-12">
                <i className="fas fa-exclamation-triangle text-6xl text-red-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-red-600 mb-2">Erreur de chargement</h3>
                <p className="text-red-500 mb-4">{productsError.message}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-zaka-orange hover:bg-zaka-orange"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  Réessayer
                </Button>
              </div>
            ) : productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {hasNextPage && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="bg-zaka-orange hover:bg-zaka-orange"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Chargement...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus mr-2"></i>
                          Voir plus de produits
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Cart FAB */}
      <div className="fixed bottom-20 right-4 md:hidden">
        <Button
          onClick={() => setLocation("/cart")}
          className="w-14 h-14 rounded-full bg-zaka-orange hover:bg-zaka-orange shadow-lg relative"
        >
          <i className="fas fa-shopping-cart text-xl"></i>
          {cartItems && cartItems.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
              {cartItems.length}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
