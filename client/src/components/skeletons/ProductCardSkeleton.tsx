import { Card, CardContent } from "@/components/ui/card";

export default function ProductCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-0">
        {/* Image placeholder */}
        <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>

        <div className="p-4">
          {/* Title placeholder */}
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>

          {/* Description placeholder */}
          <div className="h-3 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6 mb-3"></div>

          {/* Price and rating placeholder */}
          <div className="flex justify-between items-center mb-3">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>

          {/* Stock info and quantity selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            {/* Button placeholder */}
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
