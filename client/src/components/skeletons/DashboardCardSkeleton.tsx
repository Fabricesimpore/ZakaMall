import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  );
}
