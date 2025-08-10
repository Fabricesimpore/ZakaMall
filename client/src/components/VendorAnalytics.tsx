import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Package, DollarSign, Eye, Users } from "lucide-react";

export default function VendorAnalytics() {
  // Mock data for analytics - in real app this would come from API
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/vendor/analytics"],
    queryFn: async () => {
      // Mock analytics data
      return {
        totalSales: 125000,
        totalOrders: 342,
        totalProducts: 28,
        totalCustomers: 189,
        monthlyRevenue: [
          { month: "Jan", revenue: 12000 },
          { month: "Fév", revenue: 15000 },
          { month: "Mar", revenue: 18000 },
          { month: "Avr", revenue: 22000 },
          { month: "Mai", revenue: 25000 },
          { month: "Jui", revenue: 28000 },
        ],
        topProducts: [
          { name: "Smartphone Samsung", sales: 45, revenue: 67500 },
          { name: "Écouteurs Bluetooth", sales: 32, revenue: 12800 },
          { name: "Chargeur rapide", sales: 28, revenue: 8400 },
          { name: "Coque de protection", sales: 24, revenue: 4800 },
          { name: "Support téléphone", sales: 18, revenue: 2700 },
        ],
        recentOrders: [
          { id: "1", customer: "Marie Dupont", amount: 1500, status: "delivered" },
          { id: "2", customer: "Pierre Martin", amount: 800, status: "in_transit" },
          { id: "3", customer: "Sophie Laurent", amount: 2200, status: "preparing" },
          { id: "4", customer: "Jean Dubois", amount: 950, status: "confirmed" },
        ],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des analytics...</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CFA`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return "Livré";
      case "in_transit":
        return "En transit";
      case "preparing":
        return "En préparation";
      case "confirmed":
        return "Confirmé";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zaka-dark flex items-center">
          <BarChart3 className="mr-3 text-zaka-orange" size={28} />
          Analytics Vendeur
        </h2>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de vos performances et statistiques de vente
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chiffre d'affaires total</p>
                <p className="text-2xl font-bold text-zaka-dark">
                  {formatCurrency(analytics?.totalSales || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Eye className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Commandes totales</p>
                <p className="text-2xl font-bold text-zaka-dark">{analytics?.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Package className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Produits actifs</p>
                <p className="text-2xl font-bold text-zaka-dark">{analytics?.totalProducts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clients uniques</p>
                <p className="text-2xl font-bold text-zaka-dark">
                  {analytics?.totalCustomers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 text-zaka-green" size={20} />
              Produits les plus vendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topProducts?.map((product: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-600">{product.sales} ventes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zaka-green">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 text-zaka-blue" size={20} />
              Commandes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recentOrders?.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{order.customer}</h4>
                    <p className="text-xs text-gray-600">Commande #{order.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                    <p className="font-semibold text-sm">{formatCurrency(order.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 text-zaka-orange" size={20} />
            Évolution du chiffre d'affaires (6 derniers mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-center space-x-2 border-b border-gray-200">
            {analytics?.monthlyRevenue?.map((data: any, index: number) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="bg-zaka-orange rounded-t-lg w-12 transition-all hover:bg-zaka-green"
                  style={{
                    height: `${(data.revenue / Math.max(...analytics.monthlyRevenue.map((d: any) => d.revenue))) * 200}px`,
                  }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                <span className="text-xs font-medium">{(data.revenue / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
