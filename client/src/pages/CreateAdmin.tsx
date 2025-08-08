import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

export default function CreateAdmin() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user, isLoading } = useAuth();

  const createAdminMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/emergency-create");
    },
    onSuccess: (data: any) => {
      toast({
        title: "Succès !",
        description: data.message,
      });
      setTimeout(() => {
        window.location.href = "/admin";
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      setIsCreating(false);
    },
  });

  const handleCreateAdmin = () => {
    setIsCreating(true);
    createAdminMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-zaka-dark">Créer un administrateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                Cette fonctionnalité ne fonctionne que s'il n'y a aucun administrateur sur la
                plateforme. Elle permet de créer le premier compte administrateur.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-zaka-orange rounded-full mx-auto mb-4 flex items-center justify-center">
                  <i className="fas fa-user-shield text-white text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Devenir administrateur</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Cliquez sur le bouton ci-dessous pour promouvoir votre compte utilisateur actuel
                  au rôle d'administrateur.
                </p>
              </div>

              {user && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Compte utilisateur actuel:</h4>
                  <p className="text-sm text-gray-600">
                    <strong>Nom:</strong> {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {user.email || "Non défini"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Rôle actuel:</strong> {user.role}
                  </p>
                </div>
              )}

              <Button
                onClick={handleCreateAdmin}
                disabled={isCreating || createAdminMutation.isPending}
                className="w-full bg-zaka-orange hover:bg-zaka-orange/90"
                size="lg"
              >
                {isCreating || createAdminMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-crown mr-2"></i>
                    Créer le compte administrateur
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="text-sm"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
