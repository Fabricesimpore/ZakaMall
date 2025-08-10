import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

interface OrderWithDetails extends Order {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    productSnapshot: any;
  }>;
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
}

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: "clock" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800", icon: "check-circle" },
  preparing: { label: "En préparation", color: "bg-orange-100 text-orange-800", icon: "box" },
  ready_for_pickup: { label: "Prêt pour récupération", color: "bg-purple-100 text-purple-800", icon: "truck" },
  in_transit: { label: "En transit", color: "bg-blue-100 text-blue-800", icon: "shipping-fast" },
  delivered: { label: "Livré", color: "bg-green-100 text-green-800", icon: "check-double" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-800", icon: "times-circle" },
};

const nextStatusOptions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["in_transit"],
  in_transit: ["delivered"],
  delivered: [],
  cancelled: [],
};

export default function VendorOrderManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get vendor orders
  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders", { status: selectedStatus === "all" ? undefined : selectedStatus }],
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, message }: { orderId: string; status: string; message?: string }) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été mis à jour avec succès",
      });
      setUpdatingOrder(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la commande",
        variant: "destructive",
      });
      setUpdatingOrder(null);
    },
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const formatPrice = (price: string) => {
    return parseInt(price).toLocaleString("fr-BF") + " CFA";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-BF", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const OrderCard = ({ order }: { order: OrderWithDetails }) => {
    const status = statusConfig[order.status as keyof typeof statusConfig];
    const availableActions = nextStatusOptions[order.status as keyof typeof nextStatusOptions];
    const [showActions, setShowActions] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <i className="fas fa-receipt text-zaka-green"></i>
                #{order.orderNumber}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(order.createdAt?.toISOString() || new Date().toISOString())}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={status.color}>
                <i className={`fas fa-${status.icon} mr-1`}></i>
                {status.label}
              </Badge>
              {availableActions.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowActions(!showActions)}
                >
                  <i className="fas fa-cog mr-1"></i>
                  Actions
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer Info */}
          {order.customer && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm flex items-center mb-2">
                <i className="fas fa-user mr-2 text-blue-600"></i>
                Client
              </h4>
              <p className="text-sm">{order.customer.name}</p>
              <p className="text-xs text-gray-600">{order.customer.phone}</p>
            </div>
          )}

          {/* Order Items */}
          {/* @ts-ignore */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <i className="fas fa-box mr-2 text-zaka-orange"></i>
              Articles ({order.items?.length || 0})
            </h4>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.productSnapshot?.images?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EProduit%3C/text%3E%3C/svg%3E"}
                      alt={item.productSnapshot?.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{item.productSnapshot?.name}</p>
                      <p className="text-xs text-gray-600">
                        Qté: {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          {order.deliveryAddress && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm flex items-center mb-1">
                <i className="fas fa-map-marker-alt mr-2 text-gray-600"></i>
                Adresse de livraison
              </h4>
              <p className="text-sm">
                {typeof order.deliveryAddress === 'object' 
                  ? (order.deliveryAddress as any)?.address 
                  : order.deliveryAddress}
              </p>
              {order.deliveryInstructions && (
                <p className="text-xs text-gray-600 mt-1">
                  Instructions: {order.deliveryInstructions}
                </p>
              )}
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-zaka-green">
              {formatPrice(order.totalAmount)}
            </span>
          </div>

          {/* Actions */}
          {showActions && availableActions.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-sm mb-3">Changer le statut</h4>
              <div className="flex gap-2 flex-wrap">
                {availableActions.map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant={action === "cancelled" ? "destructive" : "default"}
                    onClick={() => {
                      if (action === "cancelled") {
                        // Handle cancellation with reason
                        if (!cancelReason.trim()) {
                          toast({
                            title: "Raison requise",
                            description: "Veuillez indiquer la raison de l'annulation",
                            variant: "destructive",
                          });
                          return;
                        }
                      }
                      setUpdatingOrder(order.id);
                      handleStatusUpdate(order.id, action);
                    }}
                    disabled={updatingOrder === order.id}
                    className={action === "cancelled" ? "" : "bg-zaka-green hover:bg-zaka-green"}
                  >
                    {updatingOrder === order.id ? (
                      <i className="fas fa-spinner fa-spin mr-1"></i>
                    ) : (
                      <i className={`fas fa-${statusConfig[action as keyof typeof statusConfig].icon} mr-1`}></i>
                    )}
                    {statusConfig[action as keyof typeof statusConfig].label}
                  </Button>
                ))}
              </div>
              
              {(availableActions as string[]).includes("cancelled") && (
                <div className="mt-3">
                  <Textarea
                    placeholder="Raison de l'annulation (requis)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zaka-dark flex items-center">
            <i className="fas fa-clipboard-list mr-3 text-zaka-orange"></i>
            Gestion des commandes
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez le statut de vos commandes et suivez leur progression
          </p>
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les commandes</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmées</SelectItem>
            <SelectItem value="preparing">En préparation</SelectItem>
            <SelectItem value="ready_for_pickup">Prêt pour récupération</SelectItem>
            <SelectItem value="in_transit">En transit</SelectItem>
            <SelectItem value="delivered">Livrées</SelectItem>
            <SelectItem value="cancelled">Annulées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-gray-600">
              {selectedStatus === "all" 
                ? "Vous n'avez pas encore reçu de commandes" 
                : `Aucune commande avec le statut "${statusConfig[selectedStatus as keyof typeof statusConfig]?.label}"`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}