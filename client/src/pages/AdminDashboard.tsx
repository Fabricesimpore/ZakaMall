import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
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
    queryKey: ['/api/admin/dashboard'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: admins = [], isLoading: adminsLoading } = useQuery({
    queryKey: ['/api/admin/admins'],
    enabled: !!user && user.role === 'admin',
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
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
      return await apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
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

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'vendor': return 'bg-blue-100 text-blue-800';
      case 'driver': return 'bg-green-100 text-green-800';
      case 'customer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-zaka-light">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-lock text-6xl text-red-500 mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
              <p className="text-zaka-gray mb-6">
                Cette page est réservée aux administrateurs.
              </p>
              <Button onClick={() => window.location.href = "/"}>
                Retour à l'accueil
              </Button>
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
        <Tabs defaultValue="admins" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admins">Gestion administrateurs</TabsTrigger>
            <TabsTrigger value="users">Gestion utilisateurs</TabsTrigger>
          </TabsList>

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
                                {admin.firstName?.charAt(0) || admin.email?.charAt(0) || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {admin.firstName} {admin.lastName}
                              </h3>
                              <p className="text-gray-600">{admin.email}</p>
                              <p className="text-sm text-gray-500">
                                Créé le {new Date(admin.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-red-100 text-red-800">
                            Administrateur
                          </Badge>
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
                <CardTitle>Tous les utilisateurs</CardTitle>
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
                                    {userItem.firstName?.charAt(0) || userItem.email?.charAt(0) || 'U'}
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
                                {userItem.role === 'admin' ? 'Administrateur' :
                                 userItem.role === 'vendor' ? 'Vendeur' :
                                 userItem.role === 'driver' ? 'Chauffeur' : 'Client'}
                              </Badge>
                            </td>
                            <td className="py-4">
                              {new Date(userItem.createdAt).toLocaleDateString('fr-FR')}
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
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                      >
                                        <i className="fas fa-trash mr-2"></i>
                                        Supprimer
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer utilisateur</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Êtes-vous sûr de vouloir supprimer l'utilisateur "{userItem.firstName} {userItem.lastName}" ? Cette action est irréversible.
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