import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function VendorProducts() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/vendor/products'],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest('DELETE', `/api/vendor/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/stats'] });
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
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

  const toggleProductStatusMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/vendor/products/${productId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/products'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut du produit a été mis à jour",
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

  const filteredProducts = Array.isArray(products) ? products.filter((product: any) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Rupture", variant: "destructive" as const };
    if (quantity <= 5) return { label: "Stock faible", variant: "secondary" as const };
    return { label: "En stock", variant: "default" as const };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
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
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Link href="/vendor/products/new">
          <Button className="bg-zaka-orange hover:bg-zaka-orange">
            <i className="fas fa-plus mr-2"></i>
            Nouveau produit
          </Button>
        </Link>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? "Aucun produit trouvé" : "Aucun produit"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? "Essayez un autre terme de recherche"
                : "Commencez par ajouter votre premier produit"
              }
            </p>
            {!searchTerm && (
              <Link href="/vendor/products/new">
                <Button className="bg-zaka-orange hover:bg-zaka-orange">
                  <i className="fas fa-plus mr-2"></i>
                  Ajouter un produit
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product: any) => {
            const stockStatus = getStockStatus(product.quantity);
            
            return (
              <Card key={product.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-lg font-bold text-zaka-orange">
                              {parseInt(product.price).toLocaleString('fr-BF')} CFA
                            </span>
                            {product.sku && (
                              <span className="text-sm text-gray-500">
                                SKU: {product.sku}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Stock: {product.quantity} unités
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleProductStatusMutation.mutate({
                              productId: product.id,
                              isActive: !product.isActive
                            })}
                            disabled={toggleProductStatusMutation.isPending}
                          >
                            <i className={`fas ${product.isActive ? 'fa-eye-slash' : 'fa-eye'} mr-1`}></i>
                            {product.isActive ? 'Désactiver' : 'Activer'}
                          </Button>
                          
                          <Link href={`/vendor/products/${product.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <i className="fas fa-edit mr-1"></i>
                              Modifier
                            </Button>
                          </Link>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <i className="fas fa-trash mr-1"></i>
                                Supprimer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer "{product.name}" ? 
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProductMutation.mutate(product.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deleteProductMutation.isPending}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Créé le {new Date(product.createdAt).toLocaleDateString('fr-BF')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}