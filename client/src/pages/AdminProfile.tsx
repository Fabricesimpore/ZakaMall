import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function AdminProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Security check - only main admin can access
  useEffect(() => {
    if (
      !authLoading &&
      (!user || user.role !== "admin" || user.email !== "simporefabrice15@gmail.com")
    ) {
      toast({
        title: "Accès refusé",
        description: "Cette page est réservée au super administrateur",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1000);
      return;
    }
  }, [user, authLoading, toast]);

  // Fetch admin profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/admin/profile"],
    enabled: !!user && user.role === "admin" && user.email === "simporefabrice15@gmail.com",
  }) as { data: any; isLoading: boolean };

  // Update profile form with fetched data
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
      }));
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/admin/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validate password change
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast({
          title: "Erreur",
          description: "Mot de passe actuel requis pour changer le mot de passe",
          variant: "destructive",
        });
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive",
        });
        return;
      }

      if (formData.newPassword.length < 6) {
        toast({
          title: "Erreur",
          description: "Le mot de passe doit contenir au moins 6 caractères",
          variant: "destructive",
        });
        return;
      }
    }

    // Submit update
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
    };

    if (formData.newPassword) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  // Security guard - only show to main admin
  if (!user || user.role !== "admin" || user.email !== "simporefabrice15@gmail.com") {
    return (
      <div className="min-h-screen bg-zaka-light">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-lock text-6xl text-red-500 mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Accès restreint</h2>
              <p className="text-zaka-gray mb-6">
                Cette page est réservée au super administrateur principal.
              </p>
              <Button onClick={() => (window.location.href = "/admin")}>
                Retour au tableau de bord
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zaka-dark">Paramètres du profil</h1>
          <p className="text-zaka-gray mt-2">
            Gérez vos informations personnelles et mots de passe
          </p>
        </div>

        {/* Current Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profil actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-zaka-orange text-white text-xl">
                  {profile?.firstName?.charAt(0) || "F"}
                  {profile?.lastName?.charAt(0) || "S"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {profile?.firstName} {profile?.lastName}
                </h3>
                <p className="text-zaka-gray">{profile?.email}</p>
                <Badge className="bg-red-100 text-red-800 mt-1">Super Administrateur</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Modifier le profil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Votre prénom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              {/* Password Change Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Changer le mot de passe</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                      placeholder="Mot de passe actuel"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange("newPassword", e.target.value)}
                        placeholder="Nouveau mot de passe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Confirmer le mot de passe"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-zaka-orange hover:bg-zaka-orange/90"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
