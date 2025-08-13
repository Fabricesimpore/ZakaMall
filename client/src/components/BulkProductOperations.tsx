import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Package, Edit3, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: string;
  quantity: number;
  isActive: boolean;
  categoryId?: string;
  sku?: string;
  images?: string[];
}

interface BulkProductOperationsProps {
  products: Product[];
  categories?: Array<{ id: string; name: string }>;
}

interface BulkOperation {
  type: "price" | "stock" | "status" | "category";
  value: string | number;
}

export default function BulkProductOperations({ products, categories = [] }: BulkProductOperationsProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operation, setOperation] = useState<BulkOperation>({
    type: "price",
    value: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { productIds: string[]; operation: BulkOperation }) => {
      return await apiRequest("PATCH", "/api/vendor/products/bulk", data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/analytics"] });
      setSelectedProducts([]);
      setIsDialogOpen(false);
      setOperation({ type: "price", value: "" });
      
      toast({
        title: "Opération réussie",
        description: `${selectedProducts.length} produit(s) mis à jour avec succès`,
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

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBulkUpdate = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive",
      });
      return;
    }

    if (!operation.value) {
      toast({
        title: "Valeur requise",
        description: "Veuillez saisir une valeur pour l'opération",
        variant: "destructive",
      });
      return;
    }

    bulkUpdateMutation.mutate({
      productIds: selectedProducts,
      operation,
    });
  };

  const getOperationPreview = () => {
    const count = selectedProducts.length;
    if (count === 0) return "";

    switch (operation.type) {
      case "price":
        return `Mettre à jour le prix de ${count} produit(s) à ${operation.value} CFA`;
      case "stock":
        return `Définir le stock de ${count} produit(s) à ${operation.value} unités`;
      case "status":
        return `${operation.value === "true" ? "Activer" : "Désactiver"} ${count} produit(s)`;
      case "category":
        const categoryName = categories.find(c => c.id === operation.value)?.name || "Nouvelle catégorie";
        return `Changer la catégorie de ${count} produit(s) vers "${categoryName}"`;
      default:
        return "";
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 text-zaka-orange" size={20} />
          Opérations en lot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                id="select-all"
                checked={selectedProducts.length === products.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Sélectionner tout ({products.length} produits)
              </Label>
            </div>
            
            {selectedProducts.length > 0 && (
              <Badge variant="secondary">
                {selectedProducts.length} produit(s) sélectionné(s)
              </Badge>
            )}
          </div>

          {/* Product Selection Grid */}
          <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center space-x-3 p-2 rounded border cursor-pointer transition-colors ${
                    selectedProducts.includes(product.id)
                      ? "bg-zaka-orange/10 border-zaka-orange"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectProduct(product.id)}
                >
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={() => handleSelectProduct(product.id)}
                  />
                  <img
                    src={
                      product.images?.[0] ||
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23f3f4f6'/%3E%3Ctext x='20' y='20' font-family='Arial' font-size='10' fill='%236b7280' text-anchor='middle' dy='.3em'%3EP%3C/text%3E%3C/svg%3E"
                    }
                    alt={product.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{parseInt(product.price).toLocaleString()} CFA</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOperation({ type: "price", value: "" })}
                  >
                    <Edit3 className="mr-1" size={16} />
                    Modifier prix
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOperation({ type: "stock", value: "" })}
                  >
                    <Package className="mr-1" size={16} />
                    Modifier stock
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  bulkUpdateMutation.mutate({
                    productIds: selectedProducts,
                    operation: { type: "status", value: "true" },
                  });
                }}
                disabled={bulkUpdateMutation.isPending}
              >
                <ToggleRight className="mr-1" size={16} />
                Activer
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  bulkUpdateMutation.mutate({
                    productIds: selectedProducts,
                    operation: { type: "status", value: "false" },
                  });
                }}
                disabled={bulkUpdateMutation.isPending}
              >
                <ToggleLeft className="mr-1" size={16} />
                Désactiver
              </Button>

              {categories.length > 0 && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOperation({ type: "category", value: "" })}
                    >
                      <Edit3 className="mr-1" size={16} />
                      Changer catégorie
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          )}
        </div>

        {/* Bulk Operation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Opération en lot</DialogTitle>
              <DialogDescription>
                Configurer l'opération à appliquer aux produits sélectionnés
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="operation-type">Type d'opération</Label>
                <Select
                  value={operation.type}
                  onValueChange={(value: "price" | "stock" | "category") =>
                    setOperation({ type: value, value: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Modifier le prix</SelectItem>
                    <SelectItem value="stock">Modifier le stock</SelectItem>
                    {categories.length > 0 && (
                      <SelectItem value="category">Changer la catégorie</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {operation.type === "price" && (
                <div>
                  <Label htmlFor="price-value">Nouveau prix (CFA)</Label>
                  <Input
                    id="price-value"
                    type="number"
                    min="0"
                    step="100"
                    value={operation.value}
                    onChange={(e) => setOperation({ ...operation, value: e.target.value })}
                    placeholder="Ex: 5000"
                  />
                </div>
              )}

              {operation.type === "stock" && (
                <div>
                  <Label htmlFor="stock-value">Nouvelle quantité</Label>
                  <Input
                    id="stock-value"
                    type="number"
                    min="0"
                    value={operation.value}
                    onChange={(e) => setOperation({ ...operation, value: e.target.value })}
                    placeholder="Ex: 50"
                  />
                </div>
              )}

              {operation.type === "category" && (
                <div>
                  <Label htmlFor="category-value">Nouvelle catégorie</Label>
                  <Select
                    value={operation.value as string}
                    onValueChange={(value) => setOperation({ ...operation, value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Preview */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Aperçu de l'opération:</p>
                <p className="text-sm text-blue-700">{getOperationPreview()}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleBulkUpdate}
                disabled={bulkUpdateMutation.isPending}
                className="bg-zaka-orange hover:bg-zaka-orange"
              >
                {bulkUpdateMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Application...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Appliquer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}