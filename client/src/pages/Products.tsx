import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/skeletons/ProductCardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Products() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const products = response?.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <i className="fas fa-store mr-3 text-zaka-orange"></i>
              Tous les produits
            </CardTitle>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : Array.isArray(products) && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
              <p className="text-gray-500">Les vendeurs n'ont pas encore ajouté de produits.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
