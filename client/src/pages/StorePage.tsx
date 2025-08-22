import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Vendor {
  id: string;
  storeName: string;
  storeSlug: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessDescription?: string;
  contactEmail: string;
  contactPhone?: string;
  status: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  images: string[] | null;
  quantity: number;
  rating: string;
  vendorId: string;
  vendorDisplayName?: string;
  vendorSlug?: string;
}

export default function StorePage() {
  const [match, params] = useRoute("/store/:slug");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const storeSlug = params?.slug;

  // Fetch vendor info
  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useQuery({
    queryKey: ["vendor", storeSlug],
    queryFn: async (): Promise<Vendor> => {
      const response = await apiRequest(`/api/vendors/by-slug/${storeSlug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Store not found");
        }
        throw new Error("Failed to fetch store information");
      }
      return response.json();
    },
    enabled: !!storeSlug,
  });

  // Fetch vendor products using search API (pre-filtered)
  const { data: searchResult, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["vendor-products", vendor?.id, searchQuery, selectedCategory, priceRange],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        vendor_id: vendor!.id,
        limit: "24",
        page: "1",
      });

      if (searchQuery) {
        searchParams.append("q", searchQuery);
      }
      if (selectedCategory) {
        searchParams.append("category", selectedCategory);
      }
      if (priceRange[0] > 0) {
        searchParams.append("price_min", priceRange[0].toString());
      }
      if (priceRange[1] < 1000000) {
        searchParams.append("price_max", priceRange[1].toString());
      }

      const response = await apiRequest(`/api/search?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    enabled: !!vendor?.id,
  });

  if (!match) {
    return null;
  }

  if (vendorError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Boutique introuvable</h1>
        <p className="text-gray-600 mb-4">
          La boutique que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <Button onClick={() => (window.location.href = "/")}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  if (vendorLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return null;
  }

  const products = searchResult?.hits || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Banner */}
          {vendor.bannerUrl && (
            <div className="mb-6">
              <img
                src={vendor.bannerUrl}
                alt={`${vendor.storeName} banner`}
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Store Info */}
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="shrink-0">
              {vendor.logoUrl ? (
                <img
                  src={vendor.logoUrl}
                  alt={`${vendor.storeName} logo`}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 bg-zaka-orange text-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {vendor.storeName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Store Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800">{vendor.storeName}</h1>
                <Badge className="bg-green-100 text-green-600">Vérifié</Badge>
              </div>
              
              {vendor.businessDescription && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {vendor.businessDescription}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Boutique depuis {new Date(vendor.createdAt).getFullYear()}</span>
                <span>•</span>
                <span>{products.length} produits</span>
                {vendor.contactPhone && (
                  <>
                    <span>•</span>
                    <span>{vendor.contactPhone}</span>
                  </>
                )}
              </div>
            </div>

            {/* Contact Actions */}
            <div className="flex gap-2">
              {vendor.contactPhone && (
                <Button variant="outline">
                  <i className="fas fa-phone mr-2"></i>
                  Contacter
                </Button>
              )}
              <Button variant="outline">
                <i className="fas fa-message mr-2"></i>
                Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Rechercher dans cette boutique..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              {/* Additional filters can be added here */}
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Produits {searchQuery && `pour "${searchQuery}"`}
              </h2>
              <span className="text-gray-500">
                {searchResult?.totalHits} produit{searchResult?.totalHits !== 1 ? "s" : ""}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: Product) => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    ...product,
                    vendorDisplayName: vendor.storeName,
                    vendorSlug: vendor.storeSlug,
                  }} 
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <i className="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery ? "Aucun produit trouvé" : "Aucun produit disponible"}
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `Aucun produit ne correspond à votre recherche "${searchQuery}"`
                : "Cette boutique n'a pas encore de produits."
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Voir tous les produits
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}