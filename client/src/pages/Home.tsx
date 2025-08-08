import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  const getDashboardLink = () => {
    switch (user?.role) {
      case "vendor":
        return "/vendor";
      case "driver":
        return "/driver";
      case "admin":
        return "/admin";
      default:
        return "/customer";
    }
  };

  return (
    <div className="min-h-screen bg-zaka-light">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zaka-dark mb-4">
            Bienvenue, {user?.firstName || "Utilisateur"} !
          </h1>
          <p className="text-xl text-zaka-gray mb-8">
            Votre rôle:{" "}
            <span className="font-semibold text-zaka-orange capitalize">{user?.role}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Dashboard Access */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-zaka-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-tachometer-alt text-2xl text-zaka-blue"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Tableau de bord</h3>
              <p className="text-zaka-gray mb-6">
                Accédez à votre tableau de bord personnalisé selon votre rôle
              </p>
              <Link href={getDashboardLink()}>
                <Button className="w-full bg-zaka-blue hover:bg-zaka-blue text-white">
                  Accéder au tableau de bord
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Marketplace */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-zaka-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shopping-bag text-2xl text-zaka-green"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Marketplace</h3>
              <p className="text-zaka-gray mb-6">
                Explorez les produits disponibles sur notre plateforme
              </p>
              <Link href="/customer">
                <Button className="w-full bg-zaka-green hover:bg-zaka-green text-white">
                  Explorer le marketplace
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user text-2xl text-zaka-orange"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Mon profil</h3>
              <p className="text-zaka-gray mb-6">
                Gérez vos informations personnelles et paramètres
              </p>
              <Link href="/profile">
                <Button className="w-full bg-zaka-orange hover:bg-zaka-orange text-white">
                  Voir le profil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific quick actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-zaka-dark mb-8 text-center">Actions rapides</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {user?.role === "vendor" && (
              <>
                <Button className="p-6 bg-zaka-blue hover:bg-zaka-blue text-white text-left h-auto">
                  <div>
                    <i className="fas fa-plus-circle text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Ajouter un produit</h3>
                    <p className="text-sm opacity-90">Créer une nouvelle annonce</p>
                  </div>
                </Button>
                <Button className="p-6 bg-zaka-green hover:bg-zaka-green text-white text-left h-auto">
                  <div>
                    <i className="fas fa-truck text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Gérer les commandes</h3>
                    <p className="text-sm opacity-90">Traiter les nouvelles commandes</p>
                  </div>
                </Button>
                <Button className="p-6 bg-zaka-orange hover:bg-zaka-orange text-white text-left h-auto">
                  <div>
                    <i className="fas fa-chart-bar text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Voir les analytics</h3>
                    <p className="text-sm opacity-90">Consulter les statistiques</p>
                  </div>
                </Button>
              </>
            )}

            {user?.role === "driver" && (
              <>
                <Button className="p-6 bg-zaka-green hover:bg-zaka-green text-white text-left h-auto">
                  <div>
                    <i className="fas fa-power-off text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Se connecter</h3>
                    <p className="text-sm opacity-90">Commencer à recevoir des livraisons</p>
                  </div>
                </Button>
                <Button className="p-6 bg-zaka-blue hover:bg-zaka-blue text-white text-left h-auto">
                  <div>
                    <i className="fas fa-map-marked-alt text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Livraisons disponibles</h3>
                    <p className="text-sm opacity-90">Voir les livraisons à proximité</p>
                  </div>
                </Button>
                <Button className="p-6 bg-zaka-orange hover:bg-zaka-orange text-white text-left h-auto">
                  <div>
                    <i className="fas fa-dollar-sign text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Mes gains</h3>
                    <p className="text-sm opacity-90">Consulter les revenus</p>
                  </div>
                </Button>
              </>
            )}

            {user?.role === "customer" && (
              <>
                <Link href="/customer">
                  <Button className="p-6 bg-zaka-blue hover:bg-zaka-blue text-white text-left h-auto">
                    <div>
                      <i className="fas fa-search text-2xl mb-2 block"></i>
                      <h3 className="font-semibold mb-1">Rechercher</h3>
                      <p className="text-sm opacity-90">Trouver des produits</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/customer">
                  <Button className="p-6 bg-zaka-green hover:bg-zaka-green text-white text-left h-auto">
                    <div>
                      <i className="fas fa-shopping-cart text-2xl mb-2 block"></i>
                      <h3 className="font-semibold mb-1">Mon panier</h3>
                      <p className="text-sm opacity-90">Voir les articles ajoutés</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/customer">
                  <Button className="p-6 bg-zaka-orange hover:bg-zaka-orange text-white text-left h-auto">
                    <div>
                      <i className="fas fa-history text-2xl mb-2 block"></i>
                      <h3 className="font-semibold mb-1">Mes commandes</h3>
                      <p className="text-sm opacity-90">Suivre mes achats</p>
                    </div>
                  </Button>
                </Link>
              </>
            )}

            {user?.role === "admin" && (
              <>
                <Button className="p-6 bg-zaka-green hover:bg-zaka-green text-white text-left h-auto">
                  <div>
                    <i className="fas fa-user-check text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Approuver vendeurs</h3>
                    <p className="text-sm opacity-90">Gérer les demandes</p>
                  </div>
                </Button>
                <Button className="p-6 bg-zaka-blue hover:bg-zaka-blue text-white text-left h-auto">
                  <div>
                    <i className="fas fa-chart-line text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Analytics plateforme</h3>
                    <p className="text-sm opacity-90">Voir les métriques globales</p>
                  </div>
                </Button>
                <Button className="p-6 bg-zaka-orange hover:bg-zaka-orange text-white text-left h-auto">
                  <div>
                    <i className="fas fa-cog text-2xl mb-2 block"></i>
                    <h3 className="font-semibold mb-1">Paramètres</h3>
                    <p className="text-sm opacity-90">Configuration système</p>
                  </div>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
