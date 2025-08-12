import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RecentlyViewed() {
  const { recentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <i className="fas fa-history mr-2 text-blue-600"></i>
            Récemment consultés
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecentlyViewed}
            className="text-gray-500 hover:text-red-500"
          >
            <i className="fas fa-trash mr-1"></i>
            Effacer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {recentlyViewed.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-32 bg-white border rounded-lg p-2 hover:shadow-md transition-shadow relative group"
            >
              <button
                onClick={() => removeFromRecentlyViewed(product.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <i className="fas fa-times"></i>
              </button>
              
              <div className="aspect-square bg-gray-100 rounded mb-2 overflow-hidden">
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-image text-gray-400"></i>
                  </div>
                )}
              </div>
              
              <div className="text-xs">
                <h4 className="font-medium line-clamp-2 mb-1" title={product.name}>
                  {product.name}
                </h4>
                <p className="text-orange-600 font-semibold">
                  {parseFloat(product.price).toLocaleString()} CFA
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(product.viewedAt).toLocaleDateString("fr-BF", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}