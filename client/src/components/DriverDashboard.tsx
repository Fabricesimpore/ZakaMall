import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order, DriverStats } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const orderStatusConfig = {
  in_transit: { label: "En livraison", variant: "default" as const, color: "text-blue-600" },
  delivered: { label: "Livrée", variant: "default" as const, color: "text-green-600" },
  ready_for_pickup: { label: "Prête", variant: "secondary" as const, color: "text-orange-600" },
};

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [] as Order[], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/driver/orders"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/driver/stats"],
  });

  const typedStats = (stats || {}) as DriverStats;

  const updateStatusMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      return await apiRequest("PATCH", "/api/driver/status", { isOnline });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/stats"] });
      toast({
        title: isOnline ? "Vous êtes en ligne" : "Vous êtes hors ligne",
        description: isOnline
          ? "Vous pouvez recevoir des commandes"
          : "Vous ne recevrez pas de nouvelles commandes",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (location: { lat: number; lng: number }) => {
      return await apiRequest("PATCH", "/api/driver/location", location);
    },
    onSuccess: () => {
      toast({
        title: "Position mise à jour",
        description: "Votre position a été mise à jour",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de localisation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/stats"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été mis à jour",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          updateLocationMutation.mutate(newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [updateLocationMutation]);

  // Update location periodically when online
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition((position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          updateLocationMutation.mutate(newLocation);
        });
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isOnline, updateLocationMutation]);

  const handleStatusToggle = (online: boolean) => {
    setIsOnline(online);
    updateStatusMutation.mutate(online);
  };

  const activeOrders = Array.isArray(orders)
    ? orders.filter(
        (order: Record<string, unknown>) =>
          order.status === "ready_for_pickup" || order.status === "in_transit"
      )
    : [];

  const completedOrders = Array.isArray(orders)
    ? orders.filter((order: Record<string, unknown>) => order.status === "delivered")
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zaka-dark">Tableau de bord chauffeur</h1>
            <p className="text-gray-600 mt-2">Gérez vos livraisons et suivez vos gains</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Statut:</span>
              <Switch
                checked={isOnline}
                onCheckedChange={handleStatusToggle}
                disabled={updateStatusMutation.isPending}
              />
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? "En ligne" : "Hors ligne"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-money-bill text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gains du jour</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading
                      ? "..."
                      : `${(typedStats.dailyEarnings || 0).toLocaleString("fr-BF")} CFA`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-shipping-fast text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Livraisons terminées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : typedStats.completedDeliveries || 0}
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
                    {statsLoading ? "..." : (typedStats.averageRating || 0).toFixed(1)}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">Livraisons en cours ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Terminées ({completedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <i className="fas fa-route text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Aucune livraison en cours
                  </h3>
                  <p className="text-gray-500">
                    {isOnline
                      ? "Attendez qu'une nouvelle commande vous soit assignée"
                      : "Activez votre statut pour recevoir des commandes"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order: Record<string, unknown>) => {
                  const statusConfig =
                    orderStatusConfig[order.status as keyof typeof orderStatusConfig];

                  return (
                    <Card key={order.id as string}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{order.orderNumber as string}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt as string).toLocaleDateString("fr-BF", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-zaka-orange">
                              Frais: {parseInt(order.deliveryFee as string).toLocaleString("fr-BF")}{" "}
                              CFA
                            </p>
                            <Badge variant={statusConfig?.variant} className="mt-1">
                              {statusConfig?.label}
                            </Badge>
                          </div>
                        </div>

                        {(order.deliveryAddress as string) && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <h4 className="font-medium text-sm mb-2">Adresse de livraison:</h4>
                            <p className="text-sm text-gray-700">
                              {typeof order.deliveryAddress === "string"
                                ? order.deliveryAddress
                                : (order.deliveryAddress as any).address}
                            </p>
                            {(order.deliveryAddress as any).phone && (
                              <p className="text-sm text-gray-600 mt-1">
                                <i className="fas fa-phone mr-1"></i>
                                {(order.deliveryAddress as any).phone}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {order.status === "ready_for_pickup" && (
                              <Button
                                onClick={() =>
                                  updateOrderStatusMutation.mutate({
                                    orderId: order.id as string,
                                    status: "in_transit",
                                  })
                                }
                                disabled={updateOrderStatusMutation.isPending}
                                className="bg-zaka-orange hover:bg-zaka-orange"
                              >
                                <i className="fas fa-truck mr-2"></i>
                                Récupérée
                              </Button>
                            )}
                            {order.status === "in_transit" && (
                              <Button
                                onClick={() =>
                                  updateOrderStatusMutation.mutate({
                                    orderId: order.id as string,
                                    status: "delivered",
                                  })
                                }
                                disabled={updateOrderStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <i className="fas fa-check mr-2"></i>
                                Livrée
                              </Button>
                            )}
                          </div>

                          <Button variant="outline" size="sm">
                            <i className="fas fa-map-marker-alt mr-2"></i>
                            Navigation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <i className="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Aucune livraison terminée
                  </h3>
                  <p className="text-gray-500">Vos livraisons terminées apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order: Record<string, unknown>) => (
                  <Card key={order.id as string}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{order.orderNumber as string}</h3>
                          <p className="text-sm text-gray-600">
                            Livrée le{" "}
                            {new Date(order.updatedAt as string).toLocaleDateString("fr-BF")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            +{parseInt(order.deliveryFee as string).toLocaleString("fr-BF")} CFA
                          </p>
                          <Badge variant="default" className="bg-green-600">
                            Livrée
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
