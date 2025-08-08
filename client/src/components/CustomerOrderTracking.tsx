import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CustomerOrderTrackingProps {
  orderId: string;
}

const orderSteps = [
  { status: "pending", label: "Commande reçue", icon: "fas fa-receipt" },
  { status: "confirmed", label: "Confirmée", icon: "fas fa-check-circle" },
  { status: "preparing", label: "En préparation", icon: "fas fa-cog" },
  { status: "ready_for_pickup", label: "Prête", icon: "fas fa-box" },
  { status: "in_transit", label: "En livraison", icon: "fas fa-truck" },
  { status: "delivered", label: "Livrée", icon: "fas fa-home" },
];

const statusConfig = {
  pending: { label: "En attente", color: "text-yellow-600", bg: "bg-yellow-100" },
  confirmed: { label: "Confirmée", color: "text-blue-600", bg: "bg-blue-100" },
  preparing: { label: "En préparation", color: "text-purple-600", bg: "bg-purple-100" },
  ready_for_pickup: { label: "Prête", color: "text-orange-600", bg: "bg-orange-100" },
  in_transit: { label: "En livraison", color: "text-indigo-600", bg: "bg-indigo-100" },
  delivered: { label: "Livrée", color: "text-green-600", bg: "bg-green-100" },
  cancelled: { label: "Annulée", color: "text-red-600", bg: "bg-red-100" },
};

export default function CustomerOrderTracking({ orderId }: CustomerOrderTrackingProps) {
  const { data: trackingData = {} as Record<string, unknown>, isLoading } = useQuery({
    queryKey: ["/api/customer/orders", orderId, "tracking"],
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Commande introuvable</h3>
          <p className="text-gray-500">Vérifiez le numéro de commande et réessayez</p>
        </CardContent>
      </Card>
    );
  }

  const { order, driver, trackingHistory } = trackingData as any;
  const currentStatus = order.status;
  const currentStepIndex = orderSteps.findIndex((step) => step.status === currentStatus);

  return (
    <div className="space-y-6">
      {/* Order Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Commande {order.orderNumber}</span>
            <Badge
              variant="secondary"
              className={`${statusConfig[currentStatus as keyof typeof statusConfig]?.bg} ${statusConfig[currentStatus as keyof typeof statusConfig]?.color}`}
            >
              {statusConfig[currentStatus as keyof typeof statusConfig]?.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Détails de la commande</h4>
              <p className="text-sm text-gray-600">
                Montant total:{" "}
                <span className="font-medium">
                  {parseInt(order.totalAmount).toLocaleString("fr-BF")} CFA
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Frais de livraison:{" "}
                <span className="font-medium">
                  {parseInt(order.deliveryFee).toLocaleString("fr-BF")} CFA
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Commandé le:{" "}
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString("fr-BF", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>

            {order.deliveryAddress && (
              <div>
                <h4 className="font-medium mb-2">Adresse de livraison</h4>
                <div className="text-sm text-gray-600">
                  <p>
                    {typeof order.deliveryAddress === "string"
                      ? order.deliveryAddress
                      : order.deliveryAddress.address}
                  </p>
                  {order.deliveryAddress.phone && (
                    <p className="mt-1">
                      <i className="fas fa-phone mr-2"></i>
                      {order.deliveryAddress.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi de la livraison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 top-12 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-8">
              {orderSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isUpcoming = index > currentStepIndex;

                return (
                  <div key={step.status} className="relative flex items-start">
                    {/* Step Circle */}
                    <div
                      className={`
                      relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 
                      ${
                        isCompleted
                          ? "bg-zaka-orange border-zaka-orange text-white"
                          : isUpcoming
                            ? "bg-gray-100 border-gray-200 text-gray-400"
                            : "bg-blue-100 border-blue-500 text-blue-600"
                      }
                    `}
                    >
                      <i className={`${step.icon} text-xl`}></i>
                    </div>

                    {/* Step Content */}
                    <div className="ml-6 flex-1">
                      <h3
                        className={`text-lg font-medium ${
                          isCompleted
                            ? "text-gray-900"
                            : isCurrent
                              ? "text-blue-600"
                              : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </h3>

                      {/* Show timestamp for completed/current steps */}
                      {(isCompleted || isCurrent) &&
                        trackingHistory?.find(
                          (h: Record<string, unknown>) => h.status === step.status
                        ) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(
                              trackingHistory?.find(
                                (h: Record<string, unknown>) => h.status === step.status
                              )?.timestamp
                            ).toLocaleDateString("fr-BF", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}

                      {/* Show description for current step */}
                      {isCurrent && (
                        <p className="text-sm text-gray-600 mt-2">
                          {
                            trackingHistory?.find(
                              (h: Record<string, unknown>) => h.status === step.status
                            )?.description
                          }
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Information */}
      {driver && (currentStatus === "in_transit" || currentStatus === "ready_for_pickup") && (
        <Card>
          <CardHeader>
            <CardTitle>Informations du chauffeur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-2xl text-gray-600"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">
                  {driver.firstName} {driver.lastName}
                </h3>
                <p className="text-sm text-gray-600">Chauffeur ZakaMall</p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star text-sm ${
                          i < Math.floor(driver.rating || 0) ? "text-yellow-400" : "text-gray-300"
                        }`}
                      ></i>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {(driver.rating || 0).toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" size="sm">
                  <i className="fas fa-phone mr-2"></i>
                  Appeler
                </Button>
                <Button variant="outline" size="sm">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  Localiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estimated Delivery */}
      {currentStatus !== "delivered" && currentStatus !== "cancelled" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Livraison estimée</h3>
                <p className="text-sm text-gray-600">
                  {currentStatus === "in_transit"
                    ? "Dans 15-30 minutes"
                    : currentStatus === "ready_for_pickup"
                      ? "Dans 30-45 minutes"
                      : "Aujourd'hui avant 18h"}
                </p>
              </div>
              <div className="text-right">
                <i className="fas fa-clock text-2xl text-zaka-orange"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
