import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create user form state
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer"
  });

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      toast({
        title: "Non autorisé",
        description: "Accès administrateur requis",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: adminStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!user && user.role === "admin",
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  const { data: admins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ["/api/admin/admins"],
    enabled: !!user && user.role === "admin",
  });

  const { data: pendingVendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ["/api/vendors", { status: "pending" }],
    enabled: !!user && user.role === "admin",
  });

  const { data: allVendors = [], isLoading: allVendorsLoading } = useQuery({
    queryKey: ["/api/vendors"],
    enabled: !!user && user.role === "admin",
  });

  const { data: pendingDrivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["/api/drivers", { status: "pending" }],
    enabled: !!user && user.role === "admin",
  });

  const { data: allDrivers = [], isLoading: allDriversLoading } = useQuery({
    queryKey: ["/api/drivers"],
    enabled: !!user && user.role === "admin",
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Succès",
        description: "Rôle utilisateur mis à jour",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle utilisateur",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Succès",
        description: "Utilisateur supprimé",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof createUserForm) => {
      return await apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      setCreateUserDialogOpen(false);
      setCreateUserForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "customer"
      });
      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const updateVendorStatusMutation = useMutation({
    mutationFn: async ({ vendorId, status }: { vendorId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/vendors/${vendorId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Succès",
        description: "Statut vendeur mis à jour",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut vendeur",
        variant: "destructive",
      });
    },
  });

  const updateDriverStatusMutation = useMutation({
    mutationFn: async ({ driverId, status }: { driverId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/drivers/${driverId}/approval-status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Succès",
        description: "Statut chauffeur mis à jour",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut chauffeur",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const handleVendorStatusChange = (vendorId: string, status: string) => {
    updateVendorStatusMutation.mutate({ vendorId, status });
  };

  const handleDriverStatusChange = (driverId: string, status: string) => {
    updateDriverStatusMutation.mutate({ driverId, status });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserForm.email || !createUserForm.password || !createUserForm.firstName || !createUserForm.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(createUserForm);
  };

  const handleCreateUserFormChange = (field: string, value: string) => {
    setCreateUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "vendor":
        return "bg-blue-100 text-blue-800";
      case "driver":
        return "bg-green-100 text-green-800";
      case "customer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVendorStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-zaka-light">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-lock text-6xl text-red-500 mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
              <p className="text-zaka-gray mb-6">Cette page est réservée aux administrateurs.</p>
              <Button onClick={() => (window.location.href = "/")}>Retour à l'accueil</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zaka-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-zaka-dark mb-8">Administration système</h1>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zaka-gray text-sm">Total administrateurs</p>
                  <p className="text-2xl font-bold text-zaka-dark">
                    {statsLoading ? "..." : (adminStats as any)?.totalAdmins || 0}
                  </p>
                </div>
                <i className="fas fa-user-shield text-2xl text-red-500"></i>
              </div>
              <p className="text-sm text-red-600 mt-2">Actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zaka-gray text-sm">Total utilisateurs</p>
                  <p className="text-2xl font-bold text-zaka-dark">
                    {statsLoading ? "..." : (adminStats as any)?.totalUsers || 0}
                  </p>
                </div>
                <i className="fas fa-users text-2xl text-zaka-blue"></i>
              </div>
              <p className="text-sm text-blue-600 mt-2">Enregistrés</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zaka-gray text-sm">Sessions actives</p>
                  <p className="text-2xl font-bold text-zaka-dark">
                    {statsLoading ? "..." : (adminStats as any)?.activeSessions || 0}
                  </p>
                </div>
                <i className="fas fa-signal text-2xl text-zaka-green"></i>
              </div>
              <p className="text-sm text-green-600 mt-2">En ligne</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zaka-gray text-sm">Disponibilité</p>
                  <p className="text-2xl font-bold text-zaka-dark">
                    {statsLoading ? "..." : (adminStats as any)?.platformUptime || "99.9%"}
                  </p>
                </div>
                <i className="fas fa-server text-2xl text-zaka-orange"></i>
              </div>
              <p className="text-sm text-orange-600 mt-2">Système</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="vendors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vendors">Demandes vendeurs</TabsTrigger>
            <TabsTrigger value="drivers">Demandes chauffeurs</TabsTrigger>
            <TabsTrigger value="admins">Gestion administrateurs</TabsTrigger>
            <TabsTrigger value="users">Gestion utilisateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            <div className="space-y-6">
              {/* Pending Vendor Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Demandes vendeurs en attente</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {(pendingVendors as any[]).length} en attente
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vendorsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-6 border rounded-lg">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : (pendingVendors as any[])?.length > 0 ? (
                    <div className="space-y-6">
                      {(pendingVendors as any[]).map((vendor: any) => (
                        <div
                          key={vendor.id}
                          className="border rounded-lg p-6 bg-yellow-50 border-yellow-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-yellow-100 text-yellow-800">
                                  {vendor.businessName?.charAt(0) || "V"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-lg font-semibold">{vendor.businessName}</h3>
                                <p className="text-gray-600">
                                  {vendor.user?.firstName} {vendor.user?.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{vendor.user?.email}</p>
                                <p className="text-xs text-gray-400">
                                  Demande soumise le{" "}
                                  {new Date(vendor.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>
                            <Badge className={getVendorStatusBadgeColor(vendor.status)}>
                              {vendor.status === "pending" ? "En attente" : vendor.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Informations entreprise
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="font-medium">Description:</span>{" "}
                                  {vendor.businessDescription}
                                </p>
                                <p>
                                  <span className="font-medium">Adresse:</span>{" "}
                                  {vendor.businessAddress}
                                </p>
                                <p>
                                  <span className="font-medium">Téléphone:</span>{" "}
                                  {vendor.businessPhone}
                                </p>
                                {vendor.taxId && (
                                  <p>
                                    <span className="font-medium">IFU:</span> {vendor.taxId}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Informations bancaires
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="font-medium">Banque:</span> {vendor.bankName}
                                </p>
                                <p>
                                  <span className="font-medium">Compte:</span> {vendor.bankAccount}
                                </p>
                              </div>

                              {(vendor.identityDocument || vendor.businessLicense) && (
                                <div className="mt-3">
                                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                    Documents
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    {vendor.identityDocument && (
                                      <p>
                                        <span className="font-medium">Pièce d'identité:</span>{" "}
                                        {vendor.identityDocument}
                                      </p>
                                    )}
                                    {vendor.businessLicense && (
                                      <p>
                                        <span className="font-medium">Registre commerce:</span>{" "}
                                        {vendor.businessLicense}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleVendorStatusChange(vendor.id, "approved")}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={updateVendorStatusMutation.isPending}
                            >
                              <i className="fas fa-check mr-2"></i>
                              Approuver
                            </Button>
                            <Button
                              onClick={() => handleVendorStatusChange(vendor.id, "rejected")}
                              variant="destructive"
                              disabled={updateVendorStatusMutation.isPending}
                            >
                              <i className="fas fa-times mr-2"></i>
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-store text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Aucune demande vendeur en attente
                      </h3>
                      <p className="text-gray-500">Les nouvelles demandes apparaîtront ici</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Vendors Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Tous les vendeurs</CardTitle>
                </CardHeader>
                <CardContent>
                  {allVendorsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 border rounded">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (allVendors as any[])?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-gray-600 text-sm border-b">
                            <th className="pb-3">Vendeur</th>
                            <th className="pb-3">Entreprise</th>
                            <th className="pb-3">Statut</th>
                            <th className="pb-3">Date inscription</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {(allVendors as any[]).map((vendor: any) => (
                            <tr key={vendor.id} className="border-b border-gray-100">
                              <td className="py-4">
                                <div className="flex items-center">
                                  <Avatar className="w-10 h-10 mr-3">
                                    <AvatarFallback className="bg-blue-100 text-blue-800">
                                      {vendor.user?.firstName?.charAt(0) ||
                                        vendor.businessName?.charAt(0) ||
                                        "V"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {vendor.user?.firstName} {vendor.user?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{vendor.user?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <p className="font-medium">{vendor.businessName}</p>
                                <p className="text-xs text-gray-500">{vendor.businessPhone}</p>
                              </td>
                              <td className="py-4">
                                <Badge className={getVendorStatusBadgeColor(vendor.status)}>
                                  {vendor.status === "approved"
                                    ? "Approuvé"
                                    : vendor.status === "pending"
                                      ? "En attente"
                                      : vendor.status === "rejected"
                                        ? "Rejeté"
                                        : vendor.status}
                                </Badge>
                              </td>
                              <td className="py-4">
                                {new Date(vendor.createdAt).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="py-4">
                                <Select
                                  value={vendor.status}
                                  onValueChange={(status) =>
                                    handleVendorStatusChange(vendor.id, status)
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="approved">Approuvé</SelectItem>
                                    <SelectItem value="rejected">Rejeté</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-store text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Aucun vendeur enregistré
                      </h3>
                      <p className="text-gray-500">
                        Les vendeurs apparaîtront ici une fois qu'ils s'inscriront
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="drivers">
            <div className="space-y-6">
              {/* Pending Driver Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Demandes chauffeurs en attente</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {(pendingDrivers as any[]).length} en attente
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {driversLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse p-6 border rounded-lg">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : (pendingDrivers as any[])?.length > 0 ? (
                    <div className="space-y-6">
                      {(pendingDrivers as any[]).map((driver: any) => (
                        <div
                          key={driver.id}
                          className="border rounded-lg p-6 bg-blue-50 border-blue-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-blue-100 text-blue-800">
                                  {driver.user?.firstName?.charAt(0) || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {driver.user?.firstName} {driver.user?.lastName}
                                </h3>
                                <p className="text-gray-600">{driver.user?.email}</p>
                                <p className="text-sm text-gray-500">{driver.user?.phone}</p>
                                <p className="text-xs text-gray-400">
                                  Demande soumise le{" "}
                                  {new Date(driver.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>
                            <Badge className={getVendorStatusBadgeColor(driver.status)}>
                              {driver.status === "pending" ? "En attente" : driver.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Informations véhicule
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="font-medium">Type:</span>{" "}
                                  {driver.vehicleType || "Non spécifié"}
                                </p>
                                <p>
                                  <span className="font-medium">Modèle:</span>{" "}
                                  {driver.vehicleModel || "Non spécifié"}
                                </p>
                                <p>
                                  <span className="font-medium">Année:</span>{" "}
                                  {driver.vehicleYear || "Non spécifiée"}
                                </p>
                                <p>
                                  <span className="font-medium">Couleur:</span>{" "}
                                  {driver.vehicleColor || "Non spécifiée"}
                                </p>
                                <p>
                                  <span className="font-medium">Plaque:</span>{" "}
                                  {driver.vehiclePlate || "Non spécifiée"}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                Informations professionnelles
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="font-medium">Permis:</span>{" "}
                                  {driver.licenseNumber || "Non spécifié"}
                                </p>
                                <p>
                                  <span className="font-medium">Expérience:</span>{" "}
                                  {driver.experience || "Non spécifiée"}
                                </p>
                                <p>
                                  <span className="font-medium">Zone de travail:</span>{" "}
                                  {driver.workZone || "Non spécifiée"}
                                </p>
                              </div>

                              {(driver.emergencyContact || driver.emergencyName) && (
                                <div className="mt-3">
                                  <h4 className="font-semibold text-sm text-gray-700 mb-2">
                                    Contact d'urgence
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    {driver.emergencyName && (
                                      <p>
                                        <span className="font-medium">Nom:</span>{" "}
                                        {driver.emergencyName}
                                      </p>
                                    )}
                                    {driver.emergencyContact && (
                                      <p>
                                        <span className="font-medium">Téléphone:</span>{" "}
                                        {driver.emergencyContact}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleDriverStatusChange(driver.id, "approved")}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={updateDriverStatusMutation.isPending}
                            >
                              <i className="fas fa-check mr-2"></i>
                              Approuver
                            </Button>
                            <Button
                              onClick={() => handleDriverStatusChange(driver.id, "rejected")}
                              variant="destructive"
                              disabled={updateDriverStatusMutation.isPending}
                            >
                              <i className="fas fa-times mr-2"></i>
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-motorcycle text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Aucune demande chauffeur en attente
                      </h3>
                      <p className="text-gray-500">Les nouvelles demandes apparaîtront ici</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Drivers Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Tous les chauffeurs</CardTitle>
                </CardHeader>
                <CardContent>
                  {allDriversLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 border rounded">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (allDrivers as any[])?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-gray-600 text-sm border-b">
                            <th className="pb-3">Chauffeur</th>
                            <th className="pb-3">Véhicule</th>
                            <th className="pb-3">Statut</th>
                            <th className="pb-3">En ligne</th>
                            <th className="pb-3">Date inscription</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {(allDrivers as any[]).map((driver: any) => (
                            <tr key={driver.id} className="border-b border-gray-100">
                              <td className="py-4">
                                <div className="flex items-center">
                                  <Avatar className="w-10 h-10 mr-3">
                                    <AvatarFallback className="bg-blue-100 text-blue-800">
                                      {driver.user?.firstName?.charAt(0) || "C"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {driver.user?.firstName} {driver.user?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{driver.user?.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <p className="font-medium">
                                  {driver.vehicleType || "Non spécifié"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {driver.vehiclePlate || "Plaque non spécifiée"}
                                </p>
                              </td>
                              <td className="py-4">
                                <Badge className={getVendorStatusBadgeColor(driver.status)}>
                                  {driver.status === "approved"
                                    ? "Approuvé"
                                    : driver.status === "pending"
                                      ? "En attente"
                                      : driver.status === "rejected"
                                        ? "Rejeté"
                                        : driver.status}
                                </Badge>
                              </td>
                              <td className="py-4">
                                <Badge
                                  variant={driver.isOnline ? "default" : "secondary"}
                                  className={
                                    driver.isOnline
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {driver.isOnline ? "En ligne" : "Hors ligne"}
                                </Badge>
                              </td>
                              <td className="py-4">
                                {new Date(driver.createdAt).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="py-4">
                                <Select
                                  value={driver.status}
                                  onValueChange={(status) =>
                                    handleDriverStatusChange(driver.id, status)
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="approved">Approuvé</SelectItem>
                                    <SelectItem value="rejected">Rejeté</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-motorcycle text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Aucun chauffeur enregistré
                      </h3>
                      <p className="text-gray-500">
                        Les chauffeurs apparaîtront ici une fois qu'ils s'inscriront
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Administrateurs du système</CardTitle>
              </CardHeader>
              <CardContent>
                {adminsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (admins as any[])?.length > 0 ? (
                  <div className="space-y-4">
                    {(admins as any[]).map((admin: any) => (
                      <div key={admin.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-red-100 text-red-800">
                                {admin.firstName?.charAt(0) || admin.email?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {admin.firstName} {admin.lastName}
                              </h3>
                              <p className="text-gray-600">{admin.email}</p>
                              <p className="text-sm text-gray-500">
                                Créé le {new Date(admin.createdAt).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-red-100 text-red-800">Administrateur</Badge>
                            {admin.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <i className="fas fa-trash mr-2"></i>
                                    Supprimer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer administrateur</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer l'administrateur "
                                      {admin.firstName} {admin.lastName}" ? Cette action
                                      est irréversible et supprimera tous les privilèges d'administration.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(admin.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-user-shield text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Aucun administrateur trouvé
                    </h3>
                    <p className="text-gray-500">
                      Utilisez l'onglet "Gestion utilisateurs" pour promouvoir des utilisateurs
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tous les utilisateurs</span>
                  <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-zaka-orange hover:bg-zaka-orange/90">
                        <i className="fas fa-plus mr-2"></i>
                        Créer utilisateur
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                        <DialogDescription>
                          Remplissez les informations pour créer un nouvel utilisateur dans le système.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom *</Label>
                            <Input
                              id="firstName"
                              value={createUserForm.firstName}
                              onChange={(e) => handleCreateUserFormChange("firstName", e.target.value)}
                              placeholder="Prénom"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Nom *</Label>
                            <Input
                              id="lastName"
                              value={createUserForm.lastName}
                              onChange={(e) => handleCreateUserFormChange("lastName", e.target.value)}
                              placeholder="Nom de famille"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={createUserForm.email}
                            onChange={(e) => handleCreateUserFormChange("email", e.target.value)}
                            placeholder="email@exemple.com"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password">Mot de passe *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={createUserForm.password}
                            onChange={(e) => handleCreateUserFormChange("password", e.target.value)}
                            placeholder="Mot de passe"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={createUserForm.phone}
                            onChange={(e) => handleCreateUserFormChange("phone", e.target.value)}
                            placeholder="+226 XX XX XX XX"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="role">Rôle</Label>
                          <Select
                            value={createUserForm.role}
                            onValueChange={(value) => handleCreateUserFormChange("role", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Client</SelectItem>
                              <SelectItem value="vendor">Vendeur</SelectItem>
                              <SelectItem value="driver">Chauffeur</SelectItem>
                              <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateUserDialogOpen(false)}
                          >
                            Annuler
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createUserMutation.isPending}
                            className="bg-zaka-orange hover:bg-zaka-orange/90"
                          >
                            {createUserMutation.isPending ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Création...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-plus mr-2"></i>
                                Créer utilisateur
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (allUsers as any[])?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-zaka-gray text-sm border-b">
                          <th className="pb-3">Utilisateur</th>
                          <th className="pb-3">Rôle</th>
                          <th className="pb-3">Date d'inscription</th>
                          <th className="pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {(allUsers as any[]).map((userItem: any) => (
                          <tr key={userItem.id} className="border-b border-gray-100">
                            <td className="py-4">
                              <div className="flex items-center">
                                <Avatar className="w-10 h-10 mr-3">
                                  <AvatarFallback className="bg-zaka-blue text-white">
                                    {userItem.firstName?.charAt(0) ||
                                      userItem.email?.charAt(0) ||
                                      "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {userItem.firstName} {userItem.lastName}
                                  </p>
                                  <p className="text-xs text-zaka-gray">{userItem.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge className={getRoleBadgeColor(userItem.role)}>
                                {userItem.role === "admin"
                                  ? "Administrateur"
                                  : userItem.role === "vendor"
                                    ? "Vendeur"
                                    : userItem.role === "driver"
                                      ? "Chauffeur"
                                      : "Client"}
                              </Badge>
                            </td>
                            <td className="py-4">
                              {new Date(userItem.createdAt).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="py-4">
                              <div className="flex space-x-2">
                                <Select
                                  value={userItem.role}
                                  onValueChange={(role) => handleRoleChange(userItem.id, role)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="customer">Client</SelectItem>
                                    <SelectItem value="vendor">Vendeur</SelectItem>
                                    <SelectItem value="driver">Chauffeur</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>

                                {userItem.id !== user?.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <i className="fas fa-trash mr-2"></i>
                                        Supprimer
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer utilisateur</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir supprimer l'utilisateur "
                                          {userItem.firstName} {userItem.lastName}" ? Cette action
                                          est irréversible.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteUser(userItem.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Supprimer
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Aucun utilisateur trouvé
                    </h3>
                    <p className="text-gray-500">
                      Les utilisateurs apparaîtront ici une fois qu'ils s'inscriront
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
