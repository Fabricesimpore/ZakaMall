import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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
  vendor?: {
    id: string;
    businessName: string;
    businessPhone: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
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

export default function OrderTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchOrderId, setSearchOrderId] = useState("");
  
  // Get user's orders
  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders/my-orders"],
    enabled: !!user,
  });

  // Search for specific order
  const { data: searchedOrder, isLoading: searchLoading } = useQuery<OrderWithDetails>({
    queryKey: ["/api/orders", searchOrderId],
    enabled: !!searchOrderId.trim(),
  });

  const handleSearch = () => {
    if (!searchOrderId.trim()) {
      toast({
        title: "Numéro de commande requis",
        description: "Veuillez saisir un numéro de commande",
        variant: "destructive",
      });
    }
  };

  const getStatusSteps = (currentStatus: string) => {
    const steps = ["confirmed", "preparing", "ready_for_pickup", "in_transit", "delivered"];
    const currentIndex = steps.indexOf(currentStatus);
    
    return steps.map((status, index) => ({
      ...statusConfig[status as keyof typeof statusConfig],
      status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const formatPrice = (price: string) => {
    return parseInt(price).toLocaleString("fr-BF") + " CFA";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-BF", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const OrderCard = ({ order }: { order: OrderWithDetails }) => {
    const status = statusConfig[order.status as keyof typeof statusConfig];
    const steps = getStatusSteps(order.status || "pending");

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-receipt text-zaka-orange"></i>
                Commande #{order.orderNumber}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Passée le {formatDate(typeof order.createdAt === 'string' ? order.createdAt : order.createdAt?.toISOString() || new Date().toISOString())}
              </p>
            </div>
            <Badge className={status.color}>
              <i className={`fas fa-${status.icon} mr-1`}></i>
              {status.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Progress */}
          {order.status !== "cancelled" && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-4 flex items-center">
                <i className="fas fa-route mr-2 text-zaka-blue"></i>
                Suivi de commande
              </h3>
              <div className="flex justify-between items-center">
                {steps.map((step, index) => (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : step.current
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-500"
                      }`}
                    >
                      <i className={`fas fa-${step.icon} text-sm`}></i>
                    </div>
                    <span className="text-xs mt-1 text-center max-w-16">
                      {step.label}
                    </span>
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute w-full h-0.5 top-4 left-8 ${
                          step.completed ? "bg-green-500" : "bg-gray-300"
                        }`}
                        style={{ width: "calc(100% - 2rem)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Items */}
          {/* @ts-ignore */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <i className="fas fa-box mr-2 text-zaka-green"></i>
              Articles commandés
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productSnapshot?.images?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EProduit%3C/text%3E%3C/svg%3E"}
                      alt={item.productSnapshot?.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{item.productSnapshot?.name}</p>
                      <p className="text-sm text-gray-600">
                        Quantité: {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">{formatPrice(item.totalPrice)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span className="text-zaka-green">{formatPrice(order.totalAmount)}</span>
            </div>
            {order.deliveryFee !== "0.00" && (
              <p className="text-sm text-gray-600">
                Dont frais de livraison: {formatPrice(order.deliveryFee || "0")}
              </p>
            )}
          </div>

          {/* Delivery Info */}
          {order.deliveryAddress && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold flex items-center mb-2">
                <i className="fas fa-map-marker-alt mr-2 text-blue-600"></i>
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

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.vendor && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm flex items-center mb-1">
                  <i className="fas fa-store mr-2 text-green-600"></i>
                  Vendeur
                </h4>
                <p className="text-sm">{order.vendor.businessName}</p>
                <p className="text-xs text-gray-600">{order.vendor.businessPhone}</p>
              </div>
            )}
            
            {order.driver && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm flex items-center mb-1">
                  <i className="fas fa-motorcycle mr-2 text-orange-600"></i>
                  Livreur
                </h4>
                <p className="text-sm">{order.driver.name}</p>
                <p className="text-xs text-gray-600">{order.driver.phone}</p>
              </div>
            )}
          </div>

          {/* Estimated Delivery */}
          {order.estimatedDeliveryTime && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium">
                <i className="fas fa-clock mr-2 text-yellow-600"></i>
                Livraison estimée: {formatDate(order.estimatedDeliveryTime?.toISOString() || new Date().toISOString())}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zaka-dark mb-2">Suivi des commandes</h1>
          <p className="text-gray-600">Suivez vos commandes et leur statut de livraison</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-search mr-2 text-zaka-orange"></i>
              Rechercher une commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Numéro de commande (ex: ORD-001)"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="bg-zaka-orange hover:bg-zaka-orange">
                <i className="fas fa-search mr-2"></i>
                Rechercher
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange mx-auto"></div>
            <p className="mt-4 text-gray-600">Recherche en cours...</p>
          </div>
        )}

        {searchedOrder && <OrderCard order={searchedOrder} />}

        {/* My Orders */}
        {user && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <i className="fas fa-history mr-2 text-zaka-blue"></i>
              Mes commandes
            </h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des commandes...</p>
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <i className="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                  <p className="text-gray-600 mb-4">Vous n'avez pas encore passé de commandes</p>
                  <Button className="bg-zaka-orange hover:bg-zaka-orange">
                    <i className="fas fa-shopping-bag mr-2"></i>
                    Commencer mes achats
                  </Button>
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
        )}
      </div>
    </div>
  );
}