import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  TrendingUp,
  Percent,
  ShoppingCart,
  Calendar,
  Users,
  Crown,
  BarChart3,
} from "lucide-react";

interface PlatformCommissionData {
  totalOrders: number;
  totalGMV: number; // Gross Merchandise Value
  totalCommissionRevenue: number;
  totalVendorEarnings: number;
  avgCommissionRate: number;
  totalDeliveryRevenue: number;
}

interface TopVendor {
  vendorId: string;
  businessName: string;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  commissionRate: number;
}

export default function PlatformCommissionAnalytics() {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Build query params for date filtering
  const queryParams = new URLSearchParams();
  if (dateRange.startDate) queryParams.append("startDate", dateRange.startDate);
  if (dateRange.endDate) queryParams.append("endDate", dateRange.endDate);

  const {
    data: platformData,
    isLoading,
    refetch,
  } = useQuery<PlatformCommissionData>({
    queryKey: [`/api/analytics/platform/commission`, queryParams.toString()],
    queryFn: async () => {
      const url = `/api/analytics/platform/commission?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch platform commission data");
      }
      return response.json();
    },
  });

  const { data: topVendors, isLoading: loadingVendors } = useQuery<TopVendor[]>({
    queryKey: [`/api/analytics/top-vendors`, queryParams.toString()],
    queryFn: async () => {
      const url = `/api/analytics/top-vendors?limit=10&${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch top vendors data");
      }
      return response.json();
    },
  });

  const handleDateRangeChange = () => {
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return `${Math.round(amount || 0).toLocaleString()} CFA`;
  };

  const formatPercentage = (rate: number) => {
    return `${(rate || 0).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const commissionMargin = platformData?.totalGMV
    ? (platformData.totalCommissionRevenue / platformData.totalGMV) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Revenue Analytics</h2>
          <p className="text-gray-600">Commission and revenue insights</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="text-sm">
              From:
            </Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate" className="text-sm">
              To:
            </Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-auto"
            />
          </div>
          <Button onClick={handleDateRangeChange} variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Merchandise Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(platformData?.totalGMV || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total marketplace volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(platformData?.totalCommissionRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Platform earnings from commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendor Earnings</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(platformData?.totalVendorEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total vendor earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
            <Percent className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatPercentage(platformData?.avgCommissionRate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Average across all vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {platformData?.totalOrders?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(platformData?.totalDeliveryRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">From delivery fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Margin</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatPercentage(commissionMargin)}
            </div>
            <p className="text-xs text-muted-foreground">Of total GMV</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Total Marketplace Volume (GMV):</span>
              <span className="text-lg font-bold">
                {formatCurrency(platformData?.totalGMV || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-blue-600">
              <span>Platform Commission Revenue:</span>
              <span className="font-bold">
                {formatCurrency(platformData?.totalCommissionRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-indigo-600">
              <span>Delivery Fee Revenue:</span>
              <span className="font-bold">
                {formatCurrency(platformData?.totalDeliveryRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-green-600">
              <span className="font-medium">Total Platform Revenue:</span>
              <span className="text-xl font-bold">
                {formatCurrency(
                  (platformData?.totalCommissionRevenue || 0) +
                    (platformData?.totalDeliveryRevenue || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 text-purple-600">
              <span>Vendor Earnings:</span>
              <span className="font-bold">
                {formatCurrency(platformData?.totalVendorEarnings || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Vendors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Top Vendors by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVendors ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {topVendors?.map((vendor, index) => (
                <div
                  key={vendor.vendorId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{vendor.businessName}</h4>
                      <p className="text-sm text-gray-600">
                        {vendor.totalOrders} orders • {formatPercentage(vendor.commissionRate)}{" "}
                        commission
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(vendor.totalRevenue)}
                    </div>
                    <div className="text-sm text-blue-600">
                      Commission: {formatCurrency(vendor.totalCommission)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
