import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "./ProductCard";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { debounce } from "lodash";

interface SearchFilters {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  vendor_id?: string;
  categories?: string[];
  brands?: string[];
  price_min?: number;
  price_max?: number;
  in_stock?: boolean;
  currency?: string;
}

interface SearchResult {
  hits: any[];
  query: string;
  processingTimeMs: number;
  hitsPerPage: number;
  page: number;
  totalPages: number;
  totalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

interface SearchViewProps {
  initialFilters?: Partial<SearchFilters>;
  showSearch?: boolean;
  title?: string;
  className?: string;
}

const SORT_OPTIONS = [
  { value: "popularity_score:desc", label: "Populaires" },
  { value: "price_cents:asc", label: "Prix croissant" },
  { value: "price_cents:desc", label: "Prix décroissant" },
  { value: "created_at:desc", label: "Plus récents" },
  { value: "updated_at:desc", label: "Récemment mis à jour" },
];

export default function SearchView({
  initialFilters = {},
  showSearch = true,
  title = "Recherche de produits",
  className = "",
}: SearchViewProps) {
  const [, setLocation] = useLocation();

  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    page: 1,
    limit: 24,
    sort: "popularity_score:desc",
    in_stock: true,
    ...initialFilters,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [expandedFacets, setExpandedFacets] = useState<Record<string, boolean>>({
    categories: true,
    brands: false,
    vendors: false,
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.price_min || 0,
    filters.price_max || 1000000,
  ]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((newFilters: SearchFilters) => {
        setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
      }, 300),
    []
  );

  // Fetch search results
  const {
    data: searchResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["search", filters],
    queryFn: async (): Promise<SearchResult> => {
      const searchParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v.toString()));
          } else {
            searchParams.set(key, value.toString());
          }
        }
      });

      const response = await apiRequest("GET", `/api/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      return response.json();
    },
  });

  // Update URL when filters change (optional)
  useEffect(() => {
    if (showSearch) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== "" &&
          value !== null &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v.toString()));
          } else {
            params.set(key, value.toString());
          }
        }
      });

      const newUrl = params.toString() ? `/search?${params.toString()}` : "/search";
      if (window.location.pathname + window.location.search !== newUrl) {
        setLocation(newUrl);
      }
    }
  }, [filters, showSearch, setLocation]);

  // Update price range when changed
  const handlePriceRangeChange = (newRange: [number, number]) => {
    setPriceRange(newRange);
    debouncedSearch({
      price_min: newRange[0] > 0 ? newRange[0] : undefined,
      price_max: newRange[1] < 1000000 ? newRange[1] : undefined,
    });
  };

  // Handle facet toggles
  const toggleFacetValue = (facetName: string, value: string) => {
    const currentValues = (filters[facetName as keyof SearchFilters] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    setFilters((prev) => ({
      ...prev,
      [facetName]: newValues.length > 0 ? newValues : undefined,
      page: 1,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      q: filters.q, // Keep search query
      page: 1,
      limit: 24,
      sort: "popularity_score:desc",
      ...initialFilters, // Keep initial filters (like vendor_id)
    });
    setPriceRange([0, 1000000]);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories?.length) count++;
    if (filters.brands?.length) count++;
    if (filters.price_min || filters.price_max) count++;
    if (filters.in_stock === false) count++; // Only count if explicitly set to false
    return count;
  };

  const facets = searchResult?.facetDistribution || {};
  const products = searchResult?.hits || [];

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            {searchResult && (
              <p className="text-gray-600">
                {searchResult.totalHits} produit{searchResult.totalHits !== 1 ? "s" : ""} trouvé
                {searchResult.totalHits !== 1 ? "s" : ""}
                {filters.q && ` pour "${filters.q}"`}
                {searchResult.processingTimeMs && (
                  <span className="text-gray-400 ml-2">({searchResult.processingTimeMs}ms)</span>
                )}
              </p>
            )}
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={filters.q || ""}
                  onChange={(e) => debouncedSearch({ q: e.target.value })}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {getActiveFilterCount() > 0 && (
                  <Badge className="ml-2 bg-zaka-orange text-white">{getActiveFilterCount()}</Badge>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {(showFilters || !showSearch) && (
            <Card className="lg:w-80 h-fit">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filtres</CardTitle>
                  {getActiveFilterCount() > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Effacer
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sort */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Trier par</label>
                  <Select
                    value={filters.sort || "popularity_score:desc"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, sort: value, page: 1 }))
                    }
                  >
                    <SelectTrigger>
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

                <Separator />

                {/* Stock Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Disponibilité
                  </label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="in-stock"
                      checked={filters.in_stock !== false}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          in_stock: checked ? undefined : false,
                          page: 1,
                        }))
                      }
                    />
                    <label htmlFor="in-stock" className="text-sm">
                      En stock uniquement
                    </label>
                  </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Prix (CFA)</label>
                  <div className="px-2 py-4">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceRangeChange}
                      min={0}
                      max={1000000}
                      step={1000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{priceRange[0].toLocaleString()} CFA</span>
                      <span>{priceRange[1].toLocaleString()} CFA</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Categories Facet */}
                {facets.categories && Object.keys(facets.categories).length > 0 && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedFacets((prev) => ({
                          ...prev,
                          categories: !prev.categories,
                        }))
                      }
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                    >
                      Catégories
                      {expandedFacets.categories ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedFacets.categories && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {Object.entries(facets.categories)
                          .sort(([, a], [, b]) => b - a)
                          .map(([category, count]) => (
                            <div key={category} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                <Checkbox
                                  id={`category-${category}`}
                                  checked={filters.categories?.includes(category) || false}
                                  onCheckedChange={() => toggleFacetValue("categories", category)}
                                />
                                <label
                                  htmlFor={`category-${category}`}
                                  className="text-sm truncate flex-1 cursor-pointer"
                                  title={category}
                                >
                                  {category}
                                </label>
                              </div>
                              <span className="text-xs text-gray-500 ml-2">{count}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Brands Facet */}
                {facets.brand && Object.keys(facets.brand).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <button
                        onClick={() =>
                          setExpandedFacets((prev) => ({
                            ...prev,
                            brands: !prev.brands,
                          }))
                        }
                        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                      >
                        Marques
                        {expandedFacets.brands ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {expandedFacets.brands && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {Object.entries(facets.brand)
                            .sort(([, a], [, b]) => b - a)
                            .map(([brand, count]) => (
                              <div key={brand} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 flex-1">
                                  <Checkbox
                                    id={`brand-${brand}`}
                                    checked={filters.brands?.includes(brand) || false}
                                    onCheckedChange={() => toggleFacetValue("brands", brand)}
                                  />
                                  <label
                                    htmlFor={`brand-${brand}`}
                                    className="text-sm truncate flex-1 cursor-pointer"
                                    title={brand}
                                  >
                                    {brand}
                                  </label>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">{count}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Vendors Facet */}
                {facets.vendor_name && Object.keys(facets.vendor_name).length > 1 && (
                  <>
                    <Separator />
                    <div>
                      <button
                        onClick={() =>
                          setExpandedFacets((prev) => ({
                            ...prev,
                            vendors: !prev.vendors,
                          }))
                        }
                        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
                      >
                        Vendeurs
                        {expandedFacets.vendors ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {expandedFacets.vendors && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {Object.entries(facets.vendor_name)
                            .sort(([, a], [, b]) => b - a)
                            .map(([vendor, count]) => (
                              <div key={vendor} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 flex-1">
                                  <Checkbox
                                    id={`vendor-${vendor}`}
                                    checked={filters.vendor_id === vendor}
                                    onCheckedChange={(checked) => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        vendor_id: checked ? vendor : undefined,
                                        page: 1,
                                      }));
                                    }}
                                  />
                                  <label
                                    htmlFor={`vendor-${vendor}`}
                                    className="text-sm truncate flex-1 cursor-pointer"
                                    title={vendor}
                                  >
                                    {vendor}
                                  </label>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">{count}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {error && (
              <Card className="p-6 text-center">
                <p className="text-red-600">Erreur lors de la recherche. Veuillez réessayer.</p>
              </Card>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {products.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        id: product.id,
                        name: product.title,
                        description: product.description,
                        price: (product.price_cents / 100).toString(),
                        images: product.images,
                        quantity: product.stock_qty,
                        rating: "0", // TODO: Add rating to search index
                        vendorId: product.vendor_id,
                        vendorDisplayName: product.vendor_name,
                        vendorSlug: product.vendor_slug,
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {searchResult && searchResult.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <Button
                      variant="outline"
                      disabled={filters.page === 1}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))
                      }
                    >
                      Précédent
                    </Button>

                    <span className="text-sm text-gray-600">
                      Page {filters.page || 1} sur {searchResult.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      disabled={filters.page === searchResult.totalPages}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: Math.min(searchResult.totalPages, (prev.page || 1) + 1),
                        }))
                      }
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
                <p className="text-gray-500 mb-4">
                  {filters.q
                    ? `Aucun résultat pour "${filters.q}". Essayez avec d'autres mots-clés.`
                    : "Aucun produit ne correspond à vos critères de recherche."}
                </p>
                {getActiveFilterCount() > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    Effacer les filtres
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
