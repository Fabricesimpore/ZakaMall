import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { DriverStats, Order, User, Driver } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const driverRegistrationSchema = z.object({
  vehicleType: z.string().min(1, "Le type de véhicule est requis"),
  licenseNumber: z.string().min(1, "Le numéro de permis est requis"),
});

export default function DriverDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [isDriverRegistrationOpen, setIsDriverRegistrationOpen] = useState(false);
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: driver = {} as User & { roleData?: Driver }, isLoading: driverLoading } = useQuery<
    User & { roleData?: Driver }
  >({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const { data: driverStats = {} as DriverStats, isLoading: statsLoading } = useQuery<DriverStats>({
    queryKey: ["/api/analytics/driver", driver?.roleData?.id],
    enabled: !!driver?.roleData?.id,
  });

  const { data: availableDeliveries = [] as Order[], isLoading: deliveriesLoading } = useQuery<
    Order[]
  >({
    queryKey: ["/api/orders", { status: "ready_for_pickup" }],
    enabled: !!driver?.roleData?.id,
  });

  const { data: currentDeliveries = [] as Order[], isLoading: currentLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", { driverId: driver?.roleData?.id, status: "in_transit" }],
    enabled: !!driver?.roleData?.id,
  });

  const updateDriverStatusMutation = useMutation({
    mutationFn: async (status: boolean) => {
      return await apiRequest("PATCH", `/api/drivers/${driver?.roleData?.id}/status`, {
        isOnline: status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Succès",
        description: isOnline ? "Vous êtes maintenant en ligne" : "Vous êtes maintenant hors ligne",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const acceptDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}/assign-driver`, {
        driverId: driver?.roleData?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Succès",
        description: "Livraison acceptée",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la livraison",
        variant: "destructive",
      });
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status: "delivered" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/driver"] });
      toast({
        title: "Succès",
        description: "Livraison terminée",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de terminer la livraison",
        variant: "destructive",
      });
    },
  });

  const driverRegistrationForm = useForm<z.infer<typeof driverRegistrationSchema>>({
    resolver: zodResolver(driverRegistrationSchema),
    defaultValues: {
      vehicleType: "",
      licenseNumber: "",
    },
  });

  const registerDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      return await apiRequest("POST", "/api/drivers", driverData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Succès",
        description:
          "Inscription livreur réussie ! Vous pouvez maintenant accepter des livraisons.",
      });
      setIsDriverRegistrationOpen(false);
      // Refresh the page to show the driver dashboard
      window.location.reload();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de vous inscrire comme livreur",
        variant: "destructive",
      });
    },
  });

  const onDriverRegistrationSubmit = (values: z.infer<typeof driverRegistrationSchema>) => {
    registerDriverMutation.mutate(values);
  };

  const handleStatusChange = (checked: boolean) => {
    setIsOnline(checked);
    updateDriverStatusMutation.mutate(checked);
  };

  if (authLoading || driverLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  if (!driver?.roleData && user?.role !== "driver") {
    return (
      <div className="min-h-screen bg-zaka-light">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-motorcycle text-6xl text-zaka-orange mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Devenir livreur</h2>
              <p className="text-zaka-gray mb-6">
                Vous devez d'abord vous inscrire en tant que livreur pour accéder à ce tableau de
                bord.
              </p>
              <Dialog open={isDriverRegistrationOpen} onOpenChange={setIsDriverRegistrationOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-zaka-orange hover:bg-zaka-orange">
                    S'inscrire comme livreur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Inscription livreur</DialogTitle>
                  </DialogHeader>
                  <Form {...driverRegistrationForm}>
                    <form
                      onSubmit={driverRegistrationForm.handleSubmit(onDriverRegistrationSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={driverRegistrationForm.control}
                        name="vehicleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type de véhicule *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Moto, Vélo, Voiture" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={driverRegistrationForm.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro de permis *</FormLabel>
                            <FormControl>
                              <Input placeholder="Numéro de votre permis de conduire" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDriverRegistrationOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          className="bg-zaka-orange hover:bg-zaka-orange"
                          disabled={registerDriverMutation.isPending}
                        >
                          {registerDriverMutation.isPending ? "Inscription..." : "S'inscrire"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zaka-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-zaka-dark mb-8">Interface livreur</h1>

        {/* Driver Status */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-zaka-green rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-user text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-zaka-dark">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-zaka-gray">Livreur</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="online-status"
                    checked={isOnline}
                    onCheckedChange={handleStatusChange}
                    disabled={updateDriverStatusMutation.isPending}
                  />
                  <Label htmlFor="online-status">
                    <Badge className={isOnline ? "bg-zaka-green" : "bg-gray-500"}>
                      {isOnline ? "En ligne" : "Hors ligne"}
                    </Badge>
                  </Label>
                </div>
              </div>
            </div>

            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zaka-light p-4 rounded-lg">
                <p className="text-sm text-zaka-gray">Gains du jour</p>
                <p className="text-xl font-bold text-zaka-dark">
                  {statsLoading
                    ? "..."
                    : `${driverStats?.dailyEarnings?.toLocaleString() || 0} CFA`}
                </p>
              </div>
              <div className="bg-zaka-light p-4 rounded-lg">
                <p className="text-sm text-zaka-gray">Livraisons effectuées</p>
                <p className="text-xl font-bold text-zaka-dark">
                  {statsLoading ? "..." : driverStats?.completedDeliveries || 0}
                </p>
              </div>
              <div className="bg-zaka-light p-4 rounded-lg">
                <p className="text-sm text-zaka-gray">Note moyenne</p>
                <p className="text-xl font-bold text-zaka-dark">
                  {statsLoading ? "..." : `${driverStats?.averageRating?.toFixed(1) || "0.0"}/5`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Delivery */}
        {currentDeliveries && currentDeliveries.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Livraison en cours</CardTitle>
            </CardHeader>
            <CardContent>
              {currentDeliveries.map((delivery: any) => (
                <div
                  key={delivery.id}
                  className="bg-zaka-blue bg-opacity-10 border border-zaka-blue rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-zaka-dark">
                        Commande {delivery.orderNumber}
                      </h4>
                      <p className="text-sm text-zaka-gray">
                        Montant: {parseFloat(delivery.totalAmount).toLocaleString()} CFA
                      </p>
                    </div>
                    <Badge className="bg-zaka-blue text-white">EN ROUTE</Badge>
                  </div>

                  {/* Mock GPS Map Area */}
                  <div className="bg-gray-200 rounded-lg h-48 mb-4 flex items-center justify-center">
                    <div className="text-center text-zaka-gray">
                      <i className="fas fa-map text-4xl mb-2"></i>
                      <p>Interface GPS intégrée</p>
                      <p className="text-sm">Temps estimé: 15 min</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      <Button variant="outline" className="border-zaka-blue text-zaka-blue">
                        <i className="fas fa-phone mr-2"></i>Appeler client
                      </Button>
                      <Button variant="outline" className="border-zaka-gray text-zaka-gray">
                        <i className="fas fa-navigation mr-2"></i>Navigation
                      </Button>
                    </div>
                    <Button
                      className="bg-zaka-green hover:bg-zaka-green"
                      onClick={() => completeDeliveryMutation.mutate(delivery.id)}
                      disabled={completeDeliveryMutation.isPending}
                    >
                      {completeDeliveryMutation.isPending ? "Traitement..." : "Livraison terminée"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Available Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle>Livraisons disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {!isOnline ? (
              <div className="text-center py-8">
                <i className="fas fa-power-off text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 mb-4">
                  Activez votre statut en ligne pour voir les livraisons disponibles
                </p>
              </div>
            ) : deliveriesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : availableDeliveries && availableDeliveries.length > 0 ? (
              <div className="space-y-4">
                {availableDeliveries.map((delivery: any) => (
                  <div
                    key={delivery.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-zaka-dark">
                          Commande {delivery.orderNumber}
                        </h4>
                        <p className="text-sm text-zaka-gray">
                          Montant: {parseFloat(delivery.totalAmount).toLocaleString()} CFA • Frais
                          de livraison: {parseFloat(delivery.deliveryFee || 0).toLocaleString()} CFA
                        </p>
                      </div>
                      {delivery.estimatedDeliveryTime && (
                        <Badge className="bg-zaka-orange text-white">URGENT</Badge>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-zaka-gray mb-3">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      <span>
                        {delivery.deliveryAddress
                          ? `Livraison: ${JSON.parse(delivery.deliveryAddress).address || "Adresse non spécifiée"}`
                          : "Adresse de livraison non spécifiée"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zaka-gray">Prêt pour récupération</span>
                      <Button
                        className="bg-zaka-green hover:bg-zaka-green"
                        onClick={() => acceptDeliveryMutation.mutate(delivery.id)}
                        disabled={acceptDeliveryMutation.isPending}
                      >
                        {acceptDeliveryMutation.isPending ? "Acceptation..." : "Accepter"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-truck text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Aucune livraison disponible pour le moment</p>
                <p className="text-sm text-gray-400 mt-2">
                  Restez en ligne pour recevoir de nouvelles notifications
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
