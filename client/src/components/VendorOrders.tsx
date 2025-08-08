import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const orderStatusConfig = {
  pending: { label: "En attente", variant: "secondary" as const, color: "text-yellow-600" },
  confirmed: { label: "Confirmée", variant: "default" as const, color: "text-blue-600" },
  preparing: { label: "En préparation", variant: "default" as const, color: "text-purple-600" },
  ready_for_pickup: { label: "Prête", variant: "default" as const, color: "text-green-600" },
  in_transit: { label: "En transit", variant: "default" as const, color: "text-indigo-600" },
  delivered: { label: "Livrée", variant: "default" as const, color: "text-green-700" },
  cancelled: { label: "Annulée", variant: "destructive" as const, color: "text-red-600" },
};

export default function VendorOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/vendor/orders", statusFilter !== "all" ? { status: statusFilter } : {}],
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/vendor/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/orders"] });
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

  const filteredOrders = Array.isArray(orders)
    ? orders.filter((order: any) => {
        if (statusFilter === "all") return true;
        return order.status === statusFilter;
      })
    : [];

  const ordersByStatus = {
    pending: filteredOrders.filter((order: any) => order.status === "pending"),
    confirmed: filteredOrders.filter((order: any) => order.status === "confirmed"),
    preparing: filteredOrders.filter((order: any) => order.status === "preparing"),
    ready: filteredOrders.filter((order: any) => order.status === "ready_for_pickup"),
    transit: filteredOrders.filter((order: any) => order.status === "in_transit"),
    delivered: filteredOrders.filter((order: any) => order.status === "delivered"),
  };

  const OrderCard = ({ order }: { order: any }) => {
    const statusConfig = orderStatusConfig[order.status as keyof typeof orderStatusConfig];

    return (
      <Card key={order.id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
              <p className="text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleDateString("fr-BF", {
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
                {parseInt(order.totalAmount).toLocaleString("fr-BF")} CFA
              </p>
              <Badge variant={statusConfig.variant} className="mt-1">
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <h4 className="font-medium text-sm mb-2">Adresse de livraison:</h4>
              <p className="text-sm text-gray-700">
                {typeof order.deliveryAddress === "string"
                  ? order.deliveryAddress
                  : order.deliveryAddress.address}
              </p>
              {order.deliveryAddress.phone && (
                <p className="text-sm text-gray-600 mt-1">
                  <i className="fas fa-phone mr-1"></i>
                  {order.deliveryAddress.phone}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Changer le statut:</span>
              <Select
                value={order.status}
                onValueChange={(newStatus) =>
                  updateOrderStatusMutation.mutate({ orderId: order.id, status: newStatus })
                }
                disabled={updateOrderStatusMutation.isPending}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="preparing">En préparation</SelectItem>
                  <SelectItem value="ready_for_pickup">Prête</SelectItem>
                  <SelectItem value="in_transit">En transit</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm">
              <i className="fas fa-eye mr-2"></i>
              Voir détails
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des commandes</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les commandes</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmées</SelectItem>
            <SelectItem value="preparing">En préparation</SelectItem>
            <SelectItem value="ready_for_pickup">Prêtes</SelectItem>
            <SelectItem value="in_transit">En transit</SelectItem>
            <SelectItem value="delivered">Livrées</SelectItem>
            <SelectItem value="cancelled">Annulées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="workflow" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflow">Vue workflow</TabsTrigger>
          <TabsTrigger value="list">Liste complète</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  En attente ({ordersByStatus.pending.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {ordersByStatus.pending.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {ordersByStatus.pending.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Aucune commande en attente</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  En cours ({ordersByStatus.confirmed.length + ordersByStatus.preparing.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {[...ordersByStatus.confirmed, ...ordersByStatus.preparing].map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {ordersByStatus.confirmed.length + ordersByStatus.preparing.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Aucune commande en cours</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Terminées ({ordersByStatus.delivered.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {ordersByStatus.delivered.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {ordersByStatus.delivered.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Aucune commande terminée</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <i className="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Aucune commande trouvée
                </h3>
                <p className="text-gray-500">
                  {statusFilter === "all"
                    ? "Vous n'avez encore reçu aucune commande"
                    : `Aucune commande avec le statut "${orderStatusConfig[statusFilter as keyof typeof orderStatusConfig]?.label}"`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
