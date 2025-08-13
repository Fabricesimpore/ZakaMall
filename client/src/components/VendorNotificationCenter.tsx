import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingCart,
  Settings,
  BellRing,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { Notification } from "@shared/schema";

interface VendorNotificationSettings {
  emailNotifications: {
    newOrders: boolean;
    orderStatusChanges: boolean;
    lowStock: boolean;
    payments: boolean;
    reviews: boolean;
    system: boolean;
  };
  pushNotifications: {
    newOrders: boolean;
    orderStatusChanges: boolean;
    lowStock: boolean;
    urgentAlerts: boolean;
  };
  smsNotifications: {
    newOrders: boolean;
    urgentAlerts: boolean;
  };
  lowStockThreshold: number;
  soundEnabled: boolean;
}

export default function VendorNotificationCenter() {
  const [activeTab, setActiveTab] = useState("notifications");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { permission, requestPermission, showNotification } = useNotifications();

  // Get vendor notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/vendor/notifications"],
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Get unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/vendor/notifications/unread-count"],
    refetchInterval: 10000,
  });

  // Get notification settings
  const { data: settings = getDefaultSettings() } = useQuery<VendorNotificationSettings>({
    queryKey: ["/api/vendor/notification-settings"],
  });

  const unreadCount = unreadData?.count || 0;

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest("PATCH", `/api/vendor/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/vendor/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/notifications/unread-count"] });
      toast({ title: "Toutes les notifications ont été marquées comme lues" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest("DELETE", `/api/vendor/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/notifications/unread-count"] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: VendorNotificationSettings) =>
      apiRequest("PUT", "/api/vendor/notification-settings", settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/notification-settings"] });
      toast({ title: "Paramètres de notification mis à jour" });
    },
  });

  const testNotificationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/vendor/notifications/test"),
    onSuccess: () => {
      showNotification("Test ZakaMall", {
        body: "Votre système de notifications fonctionne correctement !",
        icon: "/favicon.ico",
      });
      toast({ title: "Notification de test envoyée" });
    },
  });

  function getDefaultSettings(): VendorNotificationSettings {
    return {
      emailNotifications: {
        newOrders: true,
        orderStatusChanges: true,
        lowStock: true,
        payments: true,
        reviews: true,
        system: true,
      },
      pushNotifications: {
        newOrders: true,
        orderStatusChanges: false,
        lowStock: true,
        urgentAlerts: true,
      },
      smsNotifications: {
        newOrders: false,
        urgentAlerts: true,
      },
      lowStockThreshold: 5,
      soundEnabled: true,
    };
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_order":
        return <ShoppingCart className="text-blue-600" size={20} />;
      case "order_status":
        return <Package className="text-purple-600" size={20} />;
      case "low_stock":
        return <AlertTriangle className="text-yellow-600" size={20} />;
      case "payment":
        return <DollarSign className="text-green-600" size={20} />;
      case "review":
        return <Bell className="text-orange-600" size={20} />;
      case "system":
        return <Settings className="text-gray-600" size={20} />;
      default:
        return <Bell className="text-gray-600" size={20} />;
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case "new_order":
        return "bg-blue-100 border-blue-300";
      case "low_stock":
        return "bg-yellow-100 border-yellow-300";
      case "payment":
        return "bg-green-100 border-green-300";
      case "urgent":
        return "bg-red-100 border-red-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = new Date(notification.createdAt || new Date()).toLocaleDateString("fr-FR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const handleSettingChange = (category: keyof VendorNotificationSettings, key: string, value: boolean | number) => {
    const updatedSettings = {
      ...settings,
      [category]: typeof settings[category] === 'object' && settings[category] !== null
        ? { ...settings[category], [key]: value }
        : value,
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const enablePushNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Notifications activées",
        description: "Vous recevrez désormais des notifications push.",
      });
    } else {
      toast({
        title: "Notifications refusées",
        description: "Vous pouvez les activer dans les paramètres de votre navigateur.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zaka-dark flex items-center">
            <BellRing className="mr-3 text-zaka-orange" size={28} />
            Centre de Notifications
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez vos notifications et alertes vendeur
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/vendor/notifications"] })}
          >
            <RefreshCw size={16} className="mr-1" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell size={16} className="mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings size={16} className="mr-2" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center">
            <AlertTriangle size={16} className="mr-2" />
            Alertes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Toutes les notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCircle size={16} className="mr-1" />
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Aucune notification
                </h3>
                <p className="text-gray-500">
                  Vous recevrez ici toutes vos notifications importantes
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotifications).map(([date, dayNotifications]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 sticky top-0 bg-background">
                    {date}
                  </h4>
                  <div className="space-y-2">
                    {dayNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`transition-all hover:shadow-md ${
                          !notification.isRead
                            ? "border-l-4 border-l-zaka-orange bg-orange-50"
                            : ""
                        } ${getPriorityColor(notification.type)}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {formatDate(notification.createdAt)}
                                  </p>
                                </div>

                                <div className="flex items-center space-x-1 ml-2">
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsReadMutation.mutate(notification.id)}
                                      disabled={markAsReadMutation.isPending}
                                      title="Marquer comme lu"
                                    >
                                      <Eye size={14} />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                    disabled={deleteNotificationMutation.isPending}
                                    className="text-red-500 hover:text-red-700"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 text-blue-600" size={20} />
                Notifications Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.emailNotifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`email-${key}`} className="text-sm font-medium">
                    {getNotificationLabel(key)}
                  </Label>
                  <Switch
                    id={`email-${key}`}
                    checked={value}
                    onCheckedChange={(checked) =>
                      handleSettingChange("emailNotifications", key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="mr-2 text-green-600" size={20} />
                Notifications Push
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {permission !== "granted" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    Les notifications push ne sont pas activées.
                  </p>
                  <Button size="sm" onClick={enablePushNotifications}>
                    Activer les notifications push
                  </Button>
                </div>
              )}

              {Object.entries(settings.pushNotifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`push-${key}`} className="text-sm font-medium">
                    {getNotificationLabel(key)}
                  </Label>
                  <Switch
                    id={`push-${key}`}
                    checked={value}
                    onCheckedChange={(checked) =>
                      handleSettingChange("pushNotifications", key, checked)
                    }
                    disabled={permission !== "granted"}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 text-orange-600" size={20} />
                Paramètres Avancés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled" className="text-sm font-medium">
                  Sons de notification
                </Label>
                <Switch
                  id="sound-enabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange("soundEnabled", "", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-threshold" className="text-sm font-medium">
                  Seuil d'alerte stock faible: {settings.lowStockThreshold} unités
                </Label>
                <input
                  type="range"
                  id="stock-threshold"
                  min="1"
                  max="20"
                  value={settings.lowStockThreshold}
                  onChange={(e) =>
                    handleSettingChange("lowStockThreshold", "", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => testNotificationMutation.mutate()}
                disabled={testNotificationMutation.isPending}
                className="w-full"
              >
                <Bell className="mr-2" size={16} />
                Tester les notifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 text-red-600" size={20} />
                Alertes Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Les alertes urgentes nécessitent une attention immédiate.
              </p>
              
              {notifications.filter(n => n.type === "urgent" || n.type === "low_stock").length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto mb-4 text-green-300" />
                  <p className="text-gray-500">Aucune alerte urgente pour le moment</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications
                    .filter(n => n.type === "urgent" || n.type === "low_stock")
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <AlertTriangle className="text-red-600" size={20} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-red-700">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                        >
                          <EyeOff size={14} />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getNotificationLabel(key: string): string {
  const labels: Record<string, string> = {
    newOrders: "Nouvelles commandes",
    orderStatusChanges: "Changements de statut des commandes",
    lowStock: "Stock faible",
    payments: "Paiements et revenus",
    reviews: "Avis et évaluations",
    system: "Messages système",
    urgentAlerts: "Alertes urgentes",
  };
  return labels[key] || key;
}