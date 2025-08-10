import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Package, TrendingDown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface ProductWithStock extends Product {
  stockLevel: "critical" | "low" | "normal" | "high";
  daysUntilOutOfStock?: number;
}

export default function VendorInventory() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [updatingStock, setUpdatingStock] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get vendor products
  const { data: products = [], isLoading } = useQuery<ProductWithStock[]>({
    queryKey: ["/api/vendor/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/vendor/products") as unknown as any[];
      return response.map((product: any) => ({
        ...product,
        stockLevel: getStockLevel(product.quantity || 0),
        daysUntilOutOfStock: calculateDaysUntilOutOfStock(product),
      }));
    },
  });

  // Get categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Get low stock alerts
  const { data: lowStockProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/vendor/products/low-stock"],
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      return await apiRequest("PATCH", `/api/products/${productId}/stock`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products/low-stock"] });
      toast({
        title: "Stock mis à jour",
        description: "Le stock du produit a été mis à jour avec succès",
      });
      setUpdatingStock(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le stock",
        variant: "destructive",
      });
      setUpdatingStock(null);
    },
  });

  const getStockLevel = (quantity: number): "critical" | "low" | "normal" | "high" => {
    if (quantity === 0) return "critical";
    if (quantity <= 5) return "low";
    if (quantity <= 20) return "normal";
    return "high";
  };

  const calculateDaysUntilOutOfStock = (product: any): number | undefined => {
    // Simple calculation based on average daily sales (mock data)
    const averageDailySales = 2; // This would come from analytics in real app
    if (product.quantity <= 0) return 0;
    return Math.floor(product.quantity / averageDailySales);
  };

  const getStockLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "low":
        return "bg-yellow-100 text-yellow-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockLevelIcon = (level: string) => {
    switch (level) {
      case "critical":
        return AlertTriangle;
      case "low":
        return TrendingDown;
      case "normal":
        return Package;
      case "high":
        return TrendingUp;
      default:
        return Package;
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory !== "all" && product.categoryId !== selectedCategory) return false;
    if (stockFilter !== "all") {
      switch (stockFilter) {
        case "critical":
          return product.stockLevel === "critical";
        case "low":
          return product.stockLevel === "low";
        case "out_of_stock":
          return (product.quantity || 0) === 0;
        case "low_stock":
          return (product.quantity || 0) <= 10;
        default:
          return true;
      }
    }
    return true;
  });

  const handleStockUpdate = (productId: string, newQuantity: number) => {
    setUpdatingStock(productId);
    updateStockMutation.mutate({ productId, quantity: newQuantity });
  };

  const StockUpdateForm = ({ product }: { product: ProductWithStock }) => {
    const [newStock, setNewStock] = useState((product.quantity || 0).toString());

    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
          className="w-20"
          min="0"
        />
        <Button
          size="sm"
          onClick={() => handleStockUpdate(product.id, parseInt(newStock))}
          disabled={updatingStock === product.id || parseInt(newStock) === product.quantity}
          className="bg-zaka-green hover:bg-zaka-green"
        >
          {updatingStock === product.id ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-check"></i>
          )}
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de l'inventaire...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zaka-dark flex items-center">
            <Package className="mr-3 text-zaka-orange" size={28} />
            Gestion d'inventaire
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez vos stocks et recevez des alertes pour les produits en rupture
          </p>
        </div>
      </div>

      {/* Alerts Section */}
      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="mr-2" size={20} />
              Alertes de stock faible ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <div className="flex items-center gap-2">
                    <img
                      src={product.images?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EProduit%3C/text%3E%3C/svg%3E"}
                      alt={product.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    {product.quantity} restant{product.quantity !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
              {lowStockProducts.length > 3 && (
                <p className="text-sm text-yellow-700 mt-2">
                  Et {lowStockProducts.length - 3} autre{lowStockProducts.length - 3 !== 1 ? 's' : ''} produit{lowStockProducts.length - 3 !== 1 ? 's' : ''}...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map((category: any) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Niveau de stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            <SelectItem value="critical">Stock critique</SelectItem>
            <SelectItem value="low">Stock faible</SelectItem>
            <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
            <SelectItem value="low_stock">≤ 10 unités</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600">
              Aucun produit ne correspond aux filtres sélectionnés
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const StockIcon = getStockLevelIcon(product.stockLevel);
            
            return (
              <Card key={product.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                    <Badge className={getStockLevelColor(product.stockLevel)}>
                      <StockIcon size={14} className="mr-1" />
                      {product.stockLevel === "critical" && "Critique"}
                      {product.stockLevel === "low" && "Faible"}
                      {product.stockLevel === "normal" && "Normal"}
                      {product.stockLevel === "high" && "Élevé"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{product.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3EProduit%3C/text%3E%3C/svg%3E"}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Prix</p>
                      <p className="font-semibold">{parseInt(product.price).toLocaleString()} CFA</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Stock actuel</span>
                      <span className="font-semibold">{product.quantity} unités</span>
                    </div>
                    
                    {product.daysUntilOutOfStock !== undefined && product.daysUntilOutOfStock <= 7 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-600">Rupture estimée</span>
                        <span className="text-red-600 font-semibold">
                          {product.daysUntilOutOfStock === 0 ? "Maintenant" : `${product.daysUntilOutOfStock}j`}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-gray-500 block mb-1">
                        Mettre à jour le stock
                      </label>
                      <StockUpdateForm product={product} />
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