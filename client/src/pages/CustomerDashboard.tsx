import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ['/api/products', searchTerm, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const { data: cartItems = [], isLoading: cartLoading } = useQuery<any[]>({
    queryKey: ['/api/cart'],
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zaka-light">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-zaka-dark mb-4 md:mb-0">Marketplace</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full md:w-80"
              />
              <i className="fas fa-search absolute left-3 top-4 text-zaka-gray"></i>
            </div>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setShowCart(!showCart)}
              className="bg-zaka-orange hover:bg-zaka-orange relative"
            >
              <i className="fas fa-shopping-cart mr-2"></i>
              Panier
              {cartItems && cartItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                  {cartItems.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Categories */}
        {!categoriesLoading && categories && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {categories.slice(0, 4).map((category: any) => (
              <div 
                key={category.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer text-center"
                onClick={() => setSelectedCategory(category.id)}
              >
                <i className={`fas fa-${category.icon || 'cube'} text-3xl text-zaka-blue mb-3`}></i>
                <p className="font-medium text-zaka-dark">{category.name}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-8">
          {/* Products Grid */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-zaka-dark mb-6">
              {searchTerm ? `Résultats pour "${searchTerm}"` : 'Produits populaires'}
            </h2>
            
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          {showCart && (
            <div className="w-80">
              <Cart onClose={() => setShowCart(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart FAB */}
      <div className="fixed bottom-20 right-4 md:hidden">
        <Button 
          onClick={() => setShowCart(!showCart)}
          className="w-14 h-14 rounded-full bg-zaka-orange hover:bg-zaka-orange shadow-lg relative"
        >
          <i className="fas fa-shopping-cart text-xl"></i>
          {cartItems && cartItems.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
              {cartItems.length}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
