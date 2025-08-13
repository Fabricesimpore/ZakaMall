import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, Percent, CreditCard, Calendar } from "lucide-react";

interface CommissionData {
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalEarnings: number;
  avgCommissionRate: number;
  totalDeliveryFees: number;
}

interface VendorCommissionAnalyticsProps {
  vendorId: string;
}

export default function VendorCommissionAnalytics({ vendorId }: VendorCommissionAnalyticsProps) {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Build query params for date filtering
  const queryParams = new URLSearchParams();
  if (dateRange.startDate) queryParams.append("startDate", dateRange.startDate);
  if (dateRange.endDate) queryParams.append("endDate", dateRange.endDate);

  const {
    data: commissionData,
    isLoading,
    refetch,
  } = useQuery<CommissionData>({
    queryKey: [`/api/analytics/vendor/${vendorId}/commission`, queryParams.toString()],
    queryFn: async () => {
      const url = `/api/analytics/vendor/${vendorId}/commission?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch commission data");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Commission Analytics</h2>

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

      {/* Commission Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(commissionData?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {commissionData?.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(commissionData?.totalEarnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">After commission deduction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <Percent className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(commissionData?.totalCommission || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              At {formatPercentage(commissionData?.avgCommissionRate || 0)} rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              {formatPercentage(commissionData?.avgCommissionRate || 0)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              This is your current commission rate applied to all orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(commissionData?.totalDeliveryFees || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Collected delivery fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Count</CardTitle>
            <div className="h-4 w-4 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">#</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {commissionData?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total completed orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium">Gross Revenue:</span>
              <span className="text-lg font-bold">
                {formatCurrency(commissionData?.totalRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-red-600">
              <span>
                Platform Commission ({formatPercentage(commissionData?.avgCommissionRate || 0)}):
              </span>
              <span className="font-bold">
                -{formatCurrency(commissionData?.totalCommission || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b text-green-600">
              <span className="font-medium">Your Net Earnings:</span>
              <span className="text-xl font-bold">
                {formatCurrency(commissionData?.totalEarnings || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 text-purple-600">
              <span>Delivery Fees (you keep 100%):</span>
              <span className="font-bold">
                +{formatCurrency(commissionData?.totalDeliveryFees || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">How Commission Works</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• Commission is calculated only on product revenue, not delivery fees</li>
            <li>• You keep 100% of delivery fees charged to customers</li>
            <li>• Commission rates may vary based on your vendor agreement</li>
            <li>• Earnings are calculated after commission deduction</li>
            <li>• All amounts are shown in CFA (West African CFA Franc)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
