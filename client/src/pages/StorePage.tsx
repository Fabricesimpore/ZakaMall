import React from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchView from "@/components/SearchView";
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

export default function StorePage() {
  const [match, params] = useRoute("/store/:slug");
  const storeSlug = params?.slug;

  // Fetch vendor info
  const {
    data: vendor,
    isLoading: vendorLoading,
    error: vendorError,
  } = useQuery({
    queryKey: ["vendor", storeSlug],
    queryFn: async (): Promise<Vendor> => {
      const response = await apiRequest("GET", `/api/vendors/by-slug/${storeSlug}`);
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
        <Button onClick={() => (window.location.href = "/")}>Retour à l'accueil</Button>
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
                <p className="text-gray-600 mb-4 leading-relaxed">{vendor.businessDescription}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Boutique depuis {new Date(vendor.createdAt).getFullYear()}</span>
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

      {/* Products Section - Using SearchView with pre-filtered vendor */}
      <SearchView
        initialFilters={{ vendor_id: vendor.id }}
        showSearch={true}
        title={`Produits de ${vendor.storeName}`}
        className="bg-white"
      />
    </div>
  );
}
