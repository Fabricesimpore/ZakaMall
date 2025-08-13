import { useQuery } from "@tanstack/react-query";
import type { VendorStats, Product, Order, User, Vendor } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import VendorProducts from "@/components/VendorProducts";
import VendorOrders from "@/components/VendorOrders";
import VendorNotificationCenter from "@/components/VendorNotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";

export default function VendorDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour accéder à cette page",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [user, authLoading, toast]);

  const { data: vendor = {} as User & { roleData?: Vendor }, isLoading: vendorLoading } = useQuery<
    User & { roleData?: Vendor }
  >({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const { data: stats = {} as VendorStats, isLoading: statsLoading } = useQuery<VendorStats>({
    queryKey: ["/api/vendor/stats"],
    enabled: !!user && user.role === "vendor" && !!vendor?.roleData,
  });

  const { data: recentOrders = [] as Order[], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/vendor/orders", { limit: 5 }],
    enabled: !!user && user.role === "vendor" && !!vendor?.roleData,
  });

  const { data: lowStockProducts = [] as Product[], isLoading: stockLoading } = useQuery<Product[]>(
    {
      queryKey: ["/api/vendor/products/low-stock"],
      enabled: !!user && user.role === "vendor" && !!vendor?.roleData,
    }
  );

  if (authLoading || vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  // Check if user is not a vendor
  if (user?.role !== "vendor") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-store text-6xl text-zaka-orange mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Devenir vendeur sur ZakaMall</h2>
              <p className="text-gray-600 mb-6">
                Rejoignez notre marketplace et vendez vos produits à travers tout le Burkina Faso.
                Vous devez compléter le processus d'inscription vendeur pour accéder à ce tableau de
                bord.
              </p>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  <i className="fas fa-check-circle mr-2"></i>
                  Avantages vendeur ZakaMall
                </h3>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• Accès à des milliers de clients</li>
                  <li>• Paiements sécurisés (Orange Money, Moov Money)</li>
                  <li>• Système de livraison intégré</li>
                  <li>• Gestion d'inventaire simplifiée</li>
                  <li>• Support client dédié</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-orange-900 mb-2">
                  <i className="fas fa-info-circle mr-2"></i>
                  Processus d'inscription (3 étapes)
                </h4>
                <ul className="text-sm text-orange-800 text-left space-y-1">
                  <li>1. Informations sur votre entreprise</li>
                  <li>2. Coordonnées bancaires pour les paiements</li>
                  <li>3. Documents d'identification (optionnels)</li>
                  <li>4. Validation sous 24-48h par notre équipe</li>
                </ul>
              </div>

              <Link href="/vendor-setup">
                <Button className="bg-zaka-orange hover:bg-zaka-orange text-white px-8 py-3 text-lg">
                  <i className="fas fa-arrow-right mr-2"></i>
                  Commencer l'inscription vendeur
                </Button>
              </Link>

              <p className="text-xs text-gray-500 mt-4">
                Déjà inscrit en tant que vendeur mais en attente d'approbation?{" "}
                <Link href="/vendor-pending" className="text-zaka-orange hover:underline">
                  Vérifiez votre statut
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is a vendor but doesn't have approved vendor roleData, show appropriate message
  if (!vendor?.roleData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Configuration du compte vendeur</h2>
              <p className="text-gray-600 mb-6">
                Votre compte a été configuré en tant que vendeur, mais nous n'arrivons pas à charger
                vos données vendeur. Cela peut arriver lors de la transition de rôle.
              </p>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <i className="fas fa-info-circle mr-2"></i>
                  Votre compte vendeur est en cours de configuration. Veuillez rafraîchir la page ou
                  contacter le support si le problème persiste.
                </p>
              </div>

              <div className="space-x-4">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-zaka-orange hover:bg-zaka-orange"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  Actualiser la page
                </Button>

                <Link href="/vendor-setup">
                  <Button variant="outline" className="border-zaka-orange text-zaka-orange">
                    <i className="fas fa-cog mr-2"></i>
                    Configuration manuelle
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If vendor exists but status is not approved
  if (vendor?.roleData?.status !== "approved") {
    const statusMessages = {
      pending: {
        icon: "fas fa-clock",
        color: "text-yellow-500",
        title: "Demande en cours d'examen",
        message:
          "Votre demande de vendeur est en cours d'examen par notre équipe. Vous recevrez une notification une fois approuvée.",
      },
      rejected: {
        icon: "fas fa-times-circle",
        color: "text-red-500",
        title: "Demande rejetée",
        message:
          "Votre demande de vendeur a été rejetée. Veuillez contacter le support pour plus d'informations.",
      },
      suspended: {
        icon: "fas fa-ban",
        color: "text-red-500",
        title: "Compte suspendu",
        message:
          "Votre compte vendeur a été temporairement suspendu. Contactez le support pour résoudre cette situation.",
      },
    };

    const statusInfo = statusMessages[vendor.roleData.status] || statusMessages.pending;

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className={`${statusInfo.icon} text-6xl ${statusInfo.color} mb-4`}></i>
              <h2 className="text-2xl font-bold mb-4">{statusInfo.title}</h2>
              <p className="text-gray-600 mb-6">{statusInfo.message}</p>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Statut actuel:</strong> {vendor.roleData.status}
                </p>
              </div>

              <Link href="/vendor-pending">
                <Button className="bg-zaka-orange hover:bg-zaka-orange">
                  <i className="fas fa-eye mr-2"></i>
                  Voir les détails
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zaka-dark">Tableau de bord vendeur</h1>
            <p className="text-gray-600 mt-2">Gérez vos produits, commandes et inventaire</p>
          </div>
          <Link href="/vendor/products/new">
            <Button className="bg-zaka-orange hover:bg-zaka-orange">
              <i className="fas fa-plus mr-2"></i>
              Ajouter un produit
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-shopping-cart text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commandes du mois</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats.monthlyOrders || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ventes totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading
                      ? "..."
                      : `${(stats.totalSales || 0).toLocaleString("fr-BF")} CFA`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-box text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Produits actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats.totalProducts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-star text-yellow-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : (stats.averageRating || 0).toFixed(1)}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {!stockLoading && lowStockProducts.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Alerte stock faible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockProducts.slice(0, 6).map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center p-3 bg-white rounded-lg border"
                  >
                    <img
                      src={
                        product.images?.[0] ||
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EProduit%3C/text%3E%3C/svg%3E"
                      }
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-sm text-orange-600">Stock: {product.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockProducts.length > 6 && (
                <p className="text-sm text-orange-600 mt-4">
                  +{lowStockProducts.length - 6} autres produits en stock faible
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs
          defaultValue={
            location.includes("/orders")
              ? "orders"
              : location.includes("/analytics")
                ? "analytics"
                : location.includes("/inventory")
                  ? "products"
                  : location.includes("/notifications")
                    ? "notifications"
                    : "overview"
          }
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-5 w-full lg:w-auto">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Commandes récentes</span>
                    <Link href="/vendor/orders">
                      <Button variant="outline" size="sm">
                        Voir tout
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map((order: any) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString("fr-BF")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {parseInt(order.totalAmount).toLocaleString("fr-BF")} CFA
                            </p>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "default"
                                  : order.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune commande récente</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/vendor/products/new">
                    <Button className="w-full justify-start" variant="outline">
                      <i className="fas fa-plus mr-2"></i>
                      Ajouter un nouveau produit
                    </Button>
                  </Link>
                  <Link href="/vendor/inventory">
                    <Button className="w-full justify-start" variant="outline">
                      <i className="fas fa-boxes mr-2"></i>
                      Gérer l'inventaire
                    </Button>
                  </Link>
                  <Link href="/vendor/orders">
                    <Button className="w-full justify-start" variant="outline">
                      <i className="fas fa-shipping-fast mr-2"></i>
                      Traiter les commandes
                    </Button>
                  </Link>
                  <Link href="/vendor/analytics">
                    <Button className="w-full justify-start" variant="outline">
                      <i className="fas fa-chart-bar mr-2"></i>
                      Voir les analytics
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <VendorProducts />
          </TabsContent>

          <TabsContent value="orders">
            <VendorOrders />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics détaillées</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Analytics avancées en cours de développement...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <VendorNotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
