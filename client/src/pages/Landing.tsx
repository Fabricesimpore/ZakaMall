import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SignupModal from "@/components/SignupModal";
import LoginModal from "@/components/LoginModal";

export default function Landing() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCustomerSignupOpen, setIsCustomerSignupOpen] = useState(false);
  const [isVendorSignupOpen, setIsVendorSignupOpen] = useState(false);
  const [isDriverSignupOpen, setIsDriverSignupOpen] = useState(false);

  const _handleLogin = () => {
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-zaka-light">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-zaka-orange">ZakaMall</h1>
                <p className="text-xs text-zaka-gray">Marketplace du Burkina</p>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button type="button" className="text-zaka-gray hover:text-zaka-dark p-2">
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#marketplace"
                className="text-zaka-dark hover:text-zaka-orange transition-colors"
              >
                Marketplace
              </a>
              <a
                href="#vendors"
                className="text-zaka-dark hover:text-zaka-orange transition-colors"
              >
                Vendeurs
              </a>
              <a
                href="#delivery"
                className="text-zaka-dark hover:text-zaka-orange transition-colors"
              >
                Livraison
              </a>
              <div className="flex space-x-4">
                <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-zaka-green text-white hover:bg-zaka-green px-4 py-2 rounded-lg transition-colors">
                      S'inscrire
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Créer un compte ZakaMall</DialogTitle>
                    </DialogHeader>
                    <SignupModal onSuccess={() => setIsSignupOpen(false)} />
                  </DialogContent>
                </Dialog>
                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="btn-force-visible hover:bg-zaka-orange/90 px-4 py-2 rounded-lg transition-colors font-medium"
                      style={{ color: "white", backgroundColor: "#ff7722" }}
                    >
                      Se connecter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Se connecter à ZakaMall</DialogTitle>
                    </DialogHeader>
                    <LoginModal onSuccess={() => setIsLoginOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-zaka-orange to-orange-600 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Le Marketplace #1 du Burkina Faso
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Connectant vendeurs, clients et livreurs avec des solutions de paiement locales
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-zaka-orange px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      S'inscrire maintenant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Rejoindre ZakaMall</DialogTitle>
                    </DialogHeader>
                    <SignupModal onSuccess={() => setIsSignupOpen(false)} />
                  </DialogContent>
                </Dialog>
                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="btn-outline-force-visible border-2 px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-zaka-orange transition-colors"
                      style={{
                        color: "white",
                        borderColor: "white",
                        backgroundColor: "transparent",
                      }}
                    >
                      Se connecter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Se connecter à ZakaMall</DialogTitle>
                    </DialogHeader>
                    <LoginModal onSuccess={() => setIsLoginOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Commerce mobile moderne en Afrique de l'Ouest"
                className="rounded-xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* User Type Selection */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-zaka-dark mb-12">
            Choisissez votre profil
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Customer Card */}
            <Card className="cursor-pointer">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-zaka-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-shopping-cart text-2xl text-zaka-blue"></i>
                </div>
                <h3 className="text-xl font-semibold text-zaka-dark mb-4">Cliente</h3>
                <p className="text-zaka-gray mb-6">
                  Découvrez des milliers de produits de vendeurs locaux
                </p>
                <ul className="text-sm text-zaka-gray space-y-2 mb-6 text-left">
                  <li>✓ Navigation facile</li>
                  <li>✓ Paiement Orange Money</li>
                  <li>✓ Livraison rapide</li>
                  <li>✓ Support en français</li>
                </ul>
                <Dialog open={isCustomerSignupOpen} onOpenChange={setIsCustomerSignupOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-zaka-blue text-white py-3 rounded-lg font-semibold hover:bg-zaka-blue transition-colors">
                      Commencer les achats
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Inscription Client</DialogTitle>
                    </DialogHeader>
                    <SignupModal onSuccess={() => setIsCustomerSignupOpen(false)} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Vendor Card */}
            <Card className="cursor-pointer">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-zaka-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-store text-2xl text-zaka-green"></i>
                </div>
                <h3 className="text-xl font-semibold text-zaka-dark mb-4">Vendeur</h3>
                <p className="text-zaka-gray mb-6">
                  Développez votre business en ligne avec notre plateforme
                </p>
                <ul className="text-sm text-zaka-gray space-y-2 mb-6 text-left">
                  <li>✓ Catalogue produits</li>
                  <li>✓ Gestion des commandes</li>
                  <li>✓ Analytics de vente</li>
                  <li>✓ Commission compétitive</li>
                </ul>
                <Dialog open={isVendorSignupOpen} onOpenChange={setIsVendorSignupOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-zaka-green text-white py-3 rounded-lg font-semibold">
                      Devenir vendeur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Inscription Vendeur</DialogTitle>
                    </DialogHeader>
                    <SignupModal onSuccess={() => setIsVendorSignupOpen(false)} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Driver Card */}
            <Card className="cursor-pointer">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-motorcycle text-2xl text-zaka-orange"></i>
                </div>
                <h3 className="text-xl font-semibold text-zaka-dark mb-4">Livreur</h3>
                <p className="text-zaka-gray mb-6">
                  Gagnez de l'argent en livrant dans votre ville
                </p>
                <ul className="text-sm text-zaka-gray space-y-2 mb-6 text-left">
                  <li>✓ Horaires flexibles</li>
                  <li>✓ Paiement quotidien</li>
                  <li>✓ GPS intégré</li>
                  <li>✓ Support 24/7</li>
                </ul>
                <Dialog open={isDriverSignupOpen} onOpenChange={setIsDriverSignupOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-zaka-orange text-white py-3 rounded-lg font-semibold hover:bg-zaka-orange transition-colors">
                      Devenir livreur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Inscription Livreur</DialogTitle>
                    </DialogHeader>
                    <SignupModal onSuccess={() => setIsDriverSignupOpen(false)} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zaka-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-zaka-orange mb-4">ZakaMall</h3>
              <p className="text-gray-300 mb-4">
                Le marketplace #1 du Burkina Faso. Connectant vendeurs, clients et livreurs.
              </p>
              <div className="flex space-x-4">
                <i className="fab fa-facebook text-xl hover:text-zaka-orange cursor-pointer"></i>
                <i className="fab fa-twitter text-xl hover:text-zaka-orange cursor-pointer"></i>
                <i className="fab fa-instagram text-xl hover:text-zaka-orange cursor-pointer"></i>
                <i className="fab fa-whatsapp text-xl hover:text-zaka-orange cursor-pointer"></i>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Pour les clients</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Comment commander
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Suivi de commande
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Service client
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Retours & remboursements
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Pour les vendeurs</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Devenir vendeur
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Centre vendeur
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Politiques
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Support vendeur
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Centre d'aide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Nous contacter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Conditions d'utilisation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-zaka-orange">
                    Confidentialité
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 ZakaMall. Tous droits réservés. Fait avec ❤️ au Burkina Faso</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
