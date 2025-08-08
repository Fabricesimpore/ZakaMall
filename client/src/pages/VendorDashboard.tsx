import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Le nom du produit est requis"),
  description: z.string().min(1, "La description est requise"),
  price: z.string().min(1, "Le prix est requis"),
  categoryId: z.string().min(1, "La catégorie est requise"),
  quantity: z.string().min(1, "La quantité est requise"),
  images: z.array(z.string()).optional(),
});

export default function VendorDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
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

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
  });

  const { data: vendorStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/analytics/vendor', user?.id],
    enabled: !!user?.id && user?.role === 'vendor',
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', { vendorId: user?.id }],
    enabled: !!user?.id && user?.role === 'vendor',
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user?.id && user?.role === 'vendor',
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest('POST', '/api/products', productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Succès",
        description: "Produit créé avec succès",
      });
      setIsAddProductOpen(false);
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
        description: "Impossible de créer le produit",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Succès",
        description: "Statut de commande mis à jour",
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

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      categoryId: "",
      quantity: "",
      images: [],
    },
  });

  const onSubmit = (values: z.infer<typeof productSchema>) => {
    createProductMutation.mutate({
      ...values,
      price: parseFloat(values.price),
      quantity: parseInt(values.quantity),
    });
  };

  if (authLoading || vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  if (user?.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-zaka-light">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-store text-6xl text-zaka-orange mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Devenir vendeur</h2>
              <p className="text-zaka-gray mb-6">
                Vous devez d'abord vous inscrire en tant que vendeur pour accéder à ce tableau de bord.
              </p>
              <Button className="w-full bg-zaka-orange text-white py-3 rounded-lg font-semibold hover:bg-zaka-orange transition-colors">
                S'inscrire comme vendeur
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
        <h1 className="text-3xl font-bold text-zaka-dark mb-8">Tableau de bord vendeur</h1>
        
        {/* Vendor Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-zaka-blue to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Ventes du mois</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : `${vendorStats?.totalSales?.toLocaleString() || 0} CFA`}
                  </p>
                </div>
                <i className="fas fa-chart-line text-3xl text-blue-200"></i>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-zaka-green to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Commandes</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : vendorStats?.monthlyOrders || 0}
                  </p>
                </div>
                <i className="fas fa-shopping-bag text-3xl text-green-200"></i>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-zaka-orange to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Produits</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : vendorStats?.totalProducts || 0}
                  </p>
                </div>
                <i className="fas fa-box text-3xl text-orange-200"></i>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Note moyenne</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : `${vendorStats?.averageRating?.toFixed(1) || "0.0"}/5`}
                  </p>
                </div>
                <i className="fas fa-star text-3xl text-purple-200"></i>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zaka-blue hover:bg-zaka-blue text-white p-6 h-auto text-left">
                <div>
                  <i className="fas fa-plus-circle text-2xl mb-2 block"></i>
                  <h3 className="font-semibold mb-1">Ajouter un produit</h3>
                  <p className="text-sm opacity-90">Créer une nouvelle annonce</p>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau produit</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du produit</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du produit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((category: any) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description du produit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix (CFA)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantité en stock</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-zaka-green hover:bg-zaka-green"
                      disabled={createProductMutation.isPending}
                    >
                      {createProductMutation.isPending ? "Création..." : "Créer le produit"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Button className="bg-zaka-green hover:bg-zaka-green text-white p-6 h-auto text-left">
            <div>
              <i className="fas fa-truck text-2xl mb-2 block"></i>
              <h3 className="font-semibold mb-1">Gérer les commandes</h3>
              <p className="text-sm opacity-90">Traiter les nouvelles commandes</p>
            </div>
          </Button>
          
          <Button className="bg-zaka-orange hover:bg-zaka-orange text-white p-6 h-auto text-left">
            <div>
              <i className="fas fa-chart-bar text-2xl mb-2 block"></i>
              <h3 className="font-semibold mb-1">Voir les analytics</h3>
              <p className="text-sm opacity-90">Consulter les statistiques</p>
            </div>
          </Button>
        </div>

        {/* Recent Orders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Commandes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
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
            ) : orders && orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-zaka-gray text-sm border-b">
                      <th className="pb-3">Commande</th>
                      <th className="pb-3">Montant</th>
                      <th className="pb-3">Statut</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {orders.slice(0, 5).map((order: any) => (
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
                          <Select
                            value={order.status}
                            onValueChange={(status) => 
                              updateOrderStatusMutation.mutate({ orderId: order.id, status })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="confirmed">Confirmée</SelectItem>
                              <SelectItem value="preparing">En préparation</SelectItem>
                              <SelectItem value="ready_for_pickup">Prête</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-shopping-bag text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Aucune commande trouvée</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Mes produits</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((product: any) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="h-32 bg-gray-100 rounded mb-4 flex items-center justify-center">
                        <i className="fas fa-image text-2xl text-gray-400"></i>
                      </div>
                      <h3 className="font-semibold text-zaka-dark mb-2">{product.name}</h3>
                      <p className="text-sm text-zaka-gray mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-zaka-orange">
                          {parseFloat(product.price).toLocaleString()} CFA
                        </span>
                        <span className="text-sm text-zaka-gray">
                          Stock: {product.quantity}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-box text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Aucun produit trouvé</p>
                <Button 
                  className="mt-4 bg-zaka-blue hover:bg-zaka-blue"
                  onClick={() => setIsAddProductOpen(true)}
                >
                  Ajouter votre premier produit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
