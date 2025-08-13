import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import ProductCard from "./ProductCard";
import { Search, Filter, X, Star, ShoppingBag, Image, Award } from "lucide-react";
import { debounce } from "lodash";

interface SearchFilters {
  query?: string;
  categoryId?: string;
  vendorId?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  hasImages?: boolean;
  tags?: string[];
  sortBy?: string;
  limit?: number;
  offset?: number;
}

interface SearchResult {
  products: any[];
  total: number;
  facets: {
    categories: { id: string; name: string; count: number }[];
    vendors: { id: string; name: string; count: number }[];
    priceRanges: { min: number; max: number; count: number; label: string }[];
    ratings: { rating: number; count: number }[];
    tags: { tag: string; count: number }[];
  };
  suggestions?: string[];
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "rating", label: "Mieux notés" },
  { value: "newest", label: "Plus récents" },
  { value: "name_asc", label: "Nom A-Z" },
  { value: "name_desc", label: "Nom Z-A" },
];

export default function AdvancedSearch() {
  const search = useSearch();
  const [, setLocation] = useLocation();

  // Parse search params manually
  const searchParams = new URLSearchParams(search);

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get("q") || "",
    categoryId: searchParams.get("categoryId") || "",
    vendorId: searchParams.get("vendorId") || "",
    priceMin: searchParams.get("priceMin") ? parseInt(searchParams.get("priceMin")!) : undefined,
    priceMax: searchParams.get("priceMax") ? parseInt(searchParams.get("priceMax")!) : undefined,
    rating: searchParams.get("rating") ? parseInt(searchParams.get("rating")!) : undefined,
    inStock: searchParams.get("inStock") === "true",
    isFeatured: searchParams.get("isFeatured") === "true",
    hasImages: searchParams.get("hasImages") === "true",
    sortBy: searchParams.get("sortBy") || "relevance",
    limit: 20,
    offset: 0,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((newFilters: SearchFilters) => {
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== false) {
          params.set(key, value.toString());
        }
      });
      setLocation(`/search?${params.toString()}`);
    }, 300),
    [setLocation]
  );

  // Search results query
  const {
    data: searchResult,
    isLoading,
    error,
  } = useQuery<SearchResult>({
    queryKey: ["/api/search", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== false) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const response = await apiRequest("GET", `/api/search?${params.toString()}`);
      return response.json();
    },
    enabled: true,
  });

  // Update filters and trigger search
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: filters.query,
      sortBy: "relevance",
      limit: 20,
      offset: 0,
    };
    setFilters(clearedFilters);
    setPriceRange([0, 100000]);
    debouncedSearch(clearedFilters);
  };

  // Load more results
  const loadMore = () => {
    const newOffset = (filters.offset || 0) + (filters.limit || 20);
    updateFilters({ offset: newOffset });
  };

  // Update price range
  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
    updateFilters({
      priceMin: values[0] > 0 ? values[0] : undefined,
      priceMax: values[1] < 100000 ? values[1] : undefined,
    });
  };

  const activeFiltersCount =
    Object.values(filters).filter(
      (value) => value !== undefined && value !== "" && value !== false && value !== "relevance"
    ).length - 3; // Exclude query, limit, offset

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher des produits..."
              value={filters.query || ""}
              onChange={(e) => updateFilters({ query: e.target.value })}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilters({ sortBy: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Results Summary */}
        {searchResult && (
          <div className="mt-4 text-sm text-gray-600">
            {searchResult.total > 0 ? (
              <>
                {searchResult.total} résultat{searchResult.total > 1 ? "s" : ""} trouvé
                {searchResult.total > 1 ? "s" : ""}
                {filters.query && ` pour "${filters.query}"`}
              </>
            ) : (
              <>Aucun résultat trouvé{filters.query && ` pour "${filters.query}"`}</>
            )}
          </div>
        )}

        {/* Search Suggestions */}
        {searchResult?.suggestions && searchResult.suggestions.length > 0 && (
          <div className="mt-2">
            <span className="text-sm text-gray-500 mr-2">Suggestions:</span>
            {searchResult.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ query: suggestion })}
                className="text-blue-600 hover:text-blue-800 p-1 h-auto"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:w-80">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filtres</CardTitle>
                  <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Effacer tout
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Quick Filters */}
                <div>
                  <h4 className="font-medium mb-3">Filtres rapides</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="inStock"
                        checked={filters.inStock}
                        onCheckedChange={(checked) =>
                          updateFilters({ inStock: checked as boolean })
                        }
                      />
                      <label htmlFor="inStock" className="text-sm flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        En stock uniquement
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={filters.isFeatured}
                        onCheckedChange={(checked) =>
                          updateFilters({ isFeatured: checked as boolean })
                        }
                      />
                      <label htmlFor="isFeatured" className="text-sm flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Produits mis en avant
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasImages"
                        checked={filters.hasImages}
                        onCheckedChange={(checked) =>
                          updateFilters({ hasImages: checked as boolean })
                        }
                      />
                      <label htmlFor="hasImages" className="text-sm flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Avec photos
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                  <h4 className="font-medium mb-3">Prix (CFA)</h4>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceChange}
                      max={100000}
                      min={0}
                      step={1000}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{priceRange[0].toLocaleString()}</span>
                      <span>{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rating Filter */}
                <div>
                  <h4 className="font-medium mb-3">Note minimum</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rating-${rating}`}
                          checked={filters.rating === rating}
                          onCheckedChange={(checked) =>
                            updateFilters({ rating: checked ? rating : undefined })
                          }
                        />
                        <label
                          htmlFor={`rating-${rating}`}
                          className="text-sm flex items-center gap-1"
                        >
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span>et plus</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories Facet */}
                {searchResult?.facets.categories && searchResult.facets.categories.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Catégories</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {searchResult.facets.categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={filters.categoryId === category.id}
                              onCheckedChange={(checked) =>
                                updateFilters({ categoryId: checked ? category.id : undefined })
                              }
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="text-sm flex-1 flex justify-between"
                            >
                              <span>{category.name}</span>
                              <span className="text-gray-500">({category.count})</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Vendors Facet */}
                {searchResult?.facets.vendors && searchResult.facets.vendors.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Vendeurs</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {searchResult.facets.vendors.map((vendor) => (
                          <div key={vendor.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`vendor-${vendor.id}`}
                              checked={filters.vendorId === vendor.id}
                              onCheckedChange={(checked) =>
                                updateFilters({ vendorId: checked ? vendor.id : undefined })
                              }
                            />
                            <label
                              htmlFor={`vendor-${vendor.id}`}
                              className="text-sm flex-1 flex justify-between"
                            >
                              <span className="truncate">{vendor.name}</span>
                              <span className="text-gray-500">({vendor.count})</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-red-600">Erreur lors de la recherche. Veuillez réessayer.</p>
              </CardContent>
            </Card>
          ) : searchResult && searchResult.products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResult.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load More Button */}
              {searchResult.products.length < searchResult.total && (
                <div className="text-center mt-8">
                  <Button onClick={loadMore} variant="outline">
                    Charger plus de résultats
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Affichage de {searchResult.products.length} sur {searchResult.total} résultats
                  </p>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
                <p className="text-gray-600 mb-4">
                  Essayez d'ajuster vos filtres ou de modifier votre recherche
                </p>
                {activeFiltersCount > 0 && (
                  <Button onClick={clearFilters} variant="outline">
                    Effacer tous les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
