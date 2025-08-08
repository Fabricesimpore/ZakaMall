import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Non autorisé",
        description: "Accès administrateur requis",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: adminStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/analytics/admin'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: pendingVendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['/api/vendors', { status: 'pending' }],
    enabled: !!user && user.role === 'admin',
  });

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user && user.role === 'admin',
  });

  const updateVendorStatusMutation = useMutation({
    mutationFn: async ({ vendorId, status }: { vendorId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/vendors/${vendorId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/admin'] });
      toast({
        title: "Succès",
        description: "Statut du vendeur mis à jour",
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
        description: "Impossible de mettre à jour le statut du vendeur",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-zaka-light">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-lock text-6xl text-red-500 mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
              <p className="text-zaka-gray mb-6">
                Cette page est réservée aux administrateurs.
              </p>
              <Button onClick={() => window.location.href = "/"}>
                Retour à l'accueil
              </Button>
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
        <h1 className="text-3xl font-bold text-zaka-dark mb-8">Panneau d'administration</h1>
        
        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zaka-gray text-sm">Vendeurs actifs</p>
                  <p className="text-2xl font-bold text-zaka-dark">
                    {statsLoading ? "..." : (adminStats as any)?.activeVendors || 0}
                  </p>
                </div>
                <i className="fas fa-store text-2xl text-zaka-green"></i>
              </div>
              <p className="text-sm text-green-600 mt-2">Approuvés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zaka-gray text-sm">Commandes du jour</p>
                  <p className="text-2xl font-bold text-zaka-dark">
                    {statsLoading ? "..." : (adminStats as any)?.dailyOrders || 0}
                  </p>
                </div>
                <i className="fas fa-shopping-cart text-2xl text-zaka-blue"></i>
              </div>
              <p className="text-sm text-blue-600 mt-2">Aujourd'hui</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zaka-gray text-sm">Revenus plateforme</p>
                  <p className="text-2xl font-bold text-zaka-dark">
                    {statsLoading ? "..." : `${((adminStats as any)?.platformRevenue || 0).toLocaleString()} CFA`}
                  </p>
                </div>
                <i className="fas fa-chart-line text-2xl text-zaka-orange"></i>
              </div>
              <p className="text-sm text-orange-600 mt-2">Total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zaka-gray text-sm">Livreurs disponibles</p>
                  <p className="text-2xl font-bold text-zaka-dark">
                    {statsLoading ? "..." : (adminStats as any)?.availableDrivers || 0}
                  </p>
                </div>
                <i className="fas fa-motorcycle text-2xl text-purple-500"></i>
              </div>
              <p className="text-sm text-green-600 mt-2">En ligne maintenant</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vendors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vendors">Gestion vendeurs</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            {/* Pending Vendor Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Vendeurs en attente d'approbation</CardTitle>
              </CardHeader>
              <CardContent>
                {vendorsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse border-b pb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (pendingVendors as any[])?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-zaka-gray text-sm border-b">
                          <th className="pb-3">Vendeur</th>
                          <th className="pb-3">Entreprise</th>
                          <th className="pb-3">Date de demande</th>
                          <th className="pb-3">Statut</th>
                          <th className="pb-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {(pendingVendors as any[]).map((vendor: any) => (
                          <tr key={vendor.id} className="border-b border-gray-100">
                            <td className="py-4">
                              <div className="flex items-center">
                                <Avatar className="w-10 h-10 mr-3">
                                  <AvatarFallback className="bg-zaka-blue text-white">
                                    {vendor.businessName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{vendor.businessName}</p>
                                  <p className="text-xs text-zaka-gray">{vendor.businessPhone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">{vendor.businessName}</td>
                            <td className="py-4">{new Date(vendor.createdAt).toLocaleDateString('fr-FR')}</td>
                            <td className="py-4">
                              <Badge className="bg-yellow-100 text-yellow-800">
                                En attente
                              </Badge>
                            </td>
                            <td className="py-4">
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm"
                                  className="bg-zaka-green hover:bg-zaka-green text-xs"
                                  onClick={() => updateVendorStatusMutation.mutate({ 
                                    vendorId: vendor.id, 
                                    status: 'approved' 
                                  })}
                                  disabled={updateVendorStatusMutation.isPending}
                                >
                                  Approuver
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="destructive"
                                  className="text-xs"
                                  onClick={() => updateVendorStatusMutation.mutate({ 
                                    vendorId: vendor.id, 
                                    status: 'rejected' 
                                  })}
                                  disabled={updateVendorStatusMutation.isPending}
                                >
                                  Rejeter
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-4xl text-green-400 mb-4"></i>
                    <p className="text-gray-500">Aucun vendeur en attente d'approbation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Commandes récentes</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse border-b pb-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (allOrders as any[])?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-zaka-gray text-sm border-b">
                          <th className="pb-3">Commande</th>
                          <th className="pb-3">Montant</th>
                          <th className="pb-3">Statut</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Paiement</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {(allOrders as any[]).slice(0, 10).map((order: any) => (
                          <tr key={order.id} className="border-b border-gray-100">
                            <td className="py-3 font-medium">{order.orderNumber}</td>
                            <td className="py-3 font-semibold">{parseFloat(order.totalAmount).toLocaleString()} CFA</td>
                            <td className="py-3">
                              <Badge 
                                className={
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }
                              >
                                {order.status === 'pending' ? 'En attente' :
                                 order.status === 'confirmed' ? 'Confirmée' :
                                 order.status === 'preparing' ? 'En préparation' :
                                 order.status === 'delivered' ? 'Livrée' : order.status}
                              </Badge>
                            </td>
                            <td className="py-3">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                            <td className="py-3">
                              <Badge 
                                className={
                                  order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {order.paymentStatus === 'completed' ? 'Payé' :
                                 order.paymentStatus === 'pending' ? 'En attente' : 'Échoué'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">Aucune commande trouvée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Activités récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-zaka-green rounded-full flex items-center justify-center mr-3 mt-1">
                        <i className="fas fa-check text-white text-xs"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Nouveau vendeur approuvé</p>
                        <p className="text-xs text-zaka-gray">il y a 2 heures</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-zaka-blue rounded-full flex items-center justify-center mr-3 mt-1">
                        <i className="fas fa-shopping-cart text-white text-xs"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pic de commandes détecté</p>
                        <p className="text-xs text-zaka-gray">+150% vs moyenne - il y a 4 heures</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-zaka-orange rounded-full flex items-center justify-center mr-3 mt-1">
                        <i className="fas fa-exclamation-triangle text-white text-xs"></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Nouveau livreur inscrit</p>
                        <p className="text-xs text-zaka-gray">il y a 6 heures</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button className="bg-zaka-blue hover:bg-zaka-blue text-white p-4 h-auto text-left">
                      <div>
                        <i className="fas fa-bullhorn text-xl mb-2 block"></i>
                        <p className="text-sm font-semibold">Envoyer notification</p>
                      </div>
                    </Button>
                    <Button className="bg-zaka-green hover:bg-zaka-green text-white p-4 h-auto text-left">
                      <div>
                        <i className="fas fa-chart-bar text-xl mb-2 block"></i>
                        <p className="text-sm font-semibold">Rapport détaillé</p>
                      </div>
                    </Button>
                    <Button className="bg-zaka-orange hover:bg-zaka-orange text-white p-4 h-auto text-left">
                      <div>
                        <i className="fas fa-cog text-xl mb-2 block"></i>
                        <p className="text-sm font-semibold">Paramètres</p>
                      </div>
                    </Button>
                    <Button className="bg-purple-500 hover:bg-purple-600 text-white p-4 h-auto text-left">
                      <div>
                        <i className="fas fa-users text-xl mb-2 block"></i>
                        <p className="text-sm font-semibold">Gérer utilisateurs</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
