import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import VendorAnalytics from "@/components/VendorAnalytics";
import type { User, Vendor } from "@shared/schema";

export default function VendorAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: vendor = {} as User & { roleData?: Vendor }, isLoading: vendorLoading } = useQuery<
    User & { roleData?: Vendor }
  >({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  if (authLoading || vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  // Check if user is an approved vendor
  if (!vendor?.roleData || user?.role !== "vendor" || vendor?.roleData?.status !== "approved") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <i className="fas fa-user-slash text-6xl text-gray-300 mb-6"></i>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Accès non autorisé</h1>
            <p className="text-gray-600 mb-8">
              Vous devez être un vendeur approuvé pour accéder à cette page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <VendorAnalytics />
      </div>
    </div>
  );
}
