import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zaka-light">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-user-times text-6xl text-gray-300 mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Non connecté</h2>
              <p className="text-zaka-gray mb-6">
                Vous devez être connecté pour voir votre profil.
              </p>
              <Button 
                className="bg-zaka-orange hover:bg-zaka-orange text-white"
                onClick={() => window.location.href = "/api/login"}
              >
                Se connecter
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-user mr-3 text-zaka-blue"></i>
              Mon Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4 p-6 bg-zaka-light rounded-lg">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-zaka-orange text-white text-xl">
                  {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-zaka-dark">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  }
                </h2>
                <p className="text-zaka-gray">{user.email}</p>
                <Badge className="mt-2 bg-zaka-blue text-white capitalize">
                  {user.role || 'customer'}
                </Badge>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zaka-dark mb-1">
                    Prénom
                  </label>
                  <div className="p-3 bg-gray-50 rounded border">
                    {user.firstName || 'Non renseigné'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zaka-dark mb-1">
                    Nom
                  </label>
                  <div className="p-3 bg-gray-50 rounded border">
                    {user.lastName || 'Non renseigné'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zaka-dark mb-1">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded border">
                    {user.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zaka-dark mb-1">
                    Rôle
                  </label>
                  <div className="p-3 bg-gray-50 rounded border capitalize">
                    {user.role || 'customer'}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                <i className="fas fa-info-circle mr-2"></i>
                Informations du compte
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {user.id}
                </div>
                <div>
                  <span className="font-medium">Créé le:</span>{' '}
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline">
                <i className="fas fa-edit mr-2"></i>
                Modifier le profil
              </Button>
              <Button 
                variant="outline" 
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => window.location.href = "/api/logout"}
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}