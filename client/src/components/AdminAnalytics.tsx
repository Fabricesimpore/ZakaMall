import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Store,
  Truck,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface AdminAnalytics {
  totalUsers: number;
  totalVendors: number;
  totalDrivers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingVendors: number;
  activeVendors: number;
  pendingOrders: number;
  completedOrders: number;
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  topVendors: Array<{ 
    id: string; 
    businessName: string; 
    totalRevenue: number; 
    totalOrders: number; 
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  platformMetrics: {
    totalProducts: number;
    totalCategories: number;
    averageOrderValue: number;
    platformCommissionEarned: number;
  };
}

export default function AdminAnalytics() {
  const { data: analytics, isLoading, error } = useQuery<AdminAnalytics>({
    queryKey: ["/api/admin/analytics"],
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600">Impossible de charger les analytics administrateur.</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-500">Les analytics seront disponibles une fois que la plateforme aura des données.</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CFA`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "vendor_registration":
        return <Store className="text-blue-600" size={16} />;
      case "order_placed":
        return <ShoppingCart className="text-green-600" size={16} />;
      case "driver_registration":
        return <Truck className="text-purple-600" size={16} />;
      case "vendor_approved":
        return <CheckCircle className="text-green-600" size={16} />;
      default:
        return <AlertCircle className="text-gray-600" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const maxRevenue = Math.max(...(analytics.monthlyRevenue?.map(m => m.revenue) || [1]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zaka-dark flex items-center">
          <BarChart3 className="mr-3 text-zaka-orange" size={28} />
          Analytics Administrateur
        </h2>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble complète de la plateforme ZakaMall
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                <p className="text-2xl font-bold text-zaka-dark">{analytics.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenus totaux</p>
                <p className="text-2xl font-bold text-zaka-dark">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Store className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendeurs actifs</p>
                <p className="text-2xl font-bold text-zaka-dark">{analytics.activeVendors}</p>
                {analytics.pendingVendors > 0 && (
                  <p className="text-xs text-orange-600">+{analytics.pendingVendors} en attente</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <ShoppingCart className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Commandes totales</p>
                <p className="text-2xl font-bold text-zaka-dark">{analytics.totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 text-zaka-green" size={20} />
            Métriques de la Plateforme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-zaka-dark">{analytics.platformMetrics.totalProducts.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Produits total</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-zaka-dark">{analytics.platformMetrics.totalCategories}</p>
              <p className="text-sm text-gray-600">Catégories</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-zaka-dark">
                {formatCurrency(analytics.platformMetrics.averageOrderValue)}
              </p>
              <p className="text-sm text-gray-600">Valeur moyenne commande</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-zaka-dark">
                {formatCurrency(analytics.platformMetrics.platformCommissionEarned)}
              </p>
              <p className="text-sm text-gray-600">Commission gagnée</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 text-zaka-blue" size={20} />
              Évolution des revenus (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-center space-x-2 border-b border-gray-200">
              {analytics.monthlyRevenue?.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="bg-zaka-blue rounded-t-lg w-12 transition-all hover:bg-zaka-orange"
                    style={{
                      height: `${(data.revenue / maxRevenue) * 200}px`,
                      minHeight: "20px",
                    }}
                  ></div>
                  <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                  <span className="text-xs font-medium">{(data.revenue / 1000).toFixed(0)}k</span>
                  <span className="text-xs text-gray-500">{data.orders} cmd</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="mr-2 text-zaka-green" size={20} />
              Top Vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topVendors?.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-zaka-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{vendor.businessName}</h4>
                      <p className="text-xs text-gray-600">{vendor.totalOrders} commandes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-zaka-green">
                      {formatCurrency(vendor.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 text-zaka-orange" size={20} />
            Activité Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity?.map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString("fr-FR")}
                  </p>
                </div>
                <Badge className={getStatusColor(activity.status)}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}