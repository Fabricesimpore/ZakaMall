import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function About() {
  return (
    <div className="min-h-screen bg-zaka-light">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zaka-dark mb-4">
            À propos de ZakaMall
          </h1>
          <p className="text-xl text-zaka-gray max-w-3xl mx-auto">
            Le marketplace #1 du Burkina Faso, connectant vendeurs, clients et livreurs 
            avec des solutions modernes et adaptées au contexte local.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-zaka-dark text-center">
              Notre Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zaka-gray leading-relaxed text-lg text-center max-w-4xl mx-auto">
              Démocratiser le commerce électronique au Burkina Faso en fournissant une plateforme 
              accessible, sécurisée et adaptée aux besoins locaux. Nous connectons les entrepreneurs 
              locaux avec les consommateurs, tout en soutenant l'économie numérique burkinabé.
            </p>
          </CardContent>
        </Card>

        {/* Vision & Values */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-zaka-dark">
                <i className="fas fa-eye text-zaka-orange mr-3"></i>
                Notre Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zaka-gray leading-relaxed">
                Devenir la plateforme de référence pour le commerce électronique en Afrique de l'Ouest, 
                en favorisant l'inclusion financière et en stimulant l'entrepreneuriat local.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-zaka-dark">
                <i className="fas fa-heart text-zaka-orange mr-3"></i>
                Nos Valeurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-zaka-gray">
                <li className="flex items-center">
                  <i className="fas fa-check text-zaka-green mr-2"></i>
                  Transparence et confiance
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-zaka-green mr-2"></i>
                  Innovation locale
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-zaka-green mr-2"></i>
                  Support communautaire
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-zaka-green mr-2"></i>
                  Excellence du service
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-zaka-dark text-center">
              Pourquoi Choisir ZakaMall ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-mobile-alt text-2xl text-zaka-orange"></i>
                </div>
                <h3 className="font-semibold text-zaka-dark mb-2">Paiements Locaux</h3>
                <p className="text-zaka-gray text-sm">
                  Orange Money, Moov Money et autres solutions de paiement mobile populaires au Burkina.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-zaka-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-motorcycle text-2xl text-zaka-blue"></i>
                </div>
                <h3 className="font-semibold text-zaka-dark mb-2">Livraison Rapide</h3>
                <p className="text-zaka-gray text-sm">
                  Réseau de livreurs locaux pour une livraison rapide dans toutes les zones de Ouagadougou.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-zaka-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shield-alt text-2xl text-zaka-green"></i>
                </div>
                <h3 className="font-semibold text-zaka-dark mb-2">Sécurité</h3>
                <p className="text-zaka-gray text-sm">
                  Transactions sécurisées, vendeurs vérifiés et protection des données personnelles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-zaka-dark text-center">
              ZakaMall en Chiffres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-zaka-orange mb-2">500+</div>
                <p className="text-zaka-gray">Vendeurs Actifs</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-zaka-blue mb-2">10K+</div>
                <p className="text-zaka-gray">Produits Disponibles</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-zaka-green mb-2">25K+</div>
                <p className="text-zaka-gray">Clients Satisfaits</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-zaka-orange mb-2">98%</div>
                <p className="text-zaka-gray">Taux de Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-zaka-dark text-center">
              Nos Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-zaka-dark mb-4">
                  <i className="fas fa-store text-zaka-orange mr-3"></i>
                  Pour les Vendeurs
                </h3>
                <ul className="space-y-3 text-zaka-gray">
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Boutique en ligne personnalisée</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Gestion des stocks et commandes</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Analytics et rapports de vente</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Support technique dédié</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Formation au e-commerce</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-zaka-dark mb-4">
                  <i className="fas fa-shopping-cart text-zaka-blue mr-3"></i>
                  Pour les Clients
                </h3>
                <ul className="space-y-3 text-zaka-gray">
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Catalogue diversifié de produits locaux</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Comparaison de prix et avis clients</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Livraison dans toute la ville</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Service client réactif</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-zaka-green mr-3 mt-1"></i>
                    <span>Garantie satisfaction</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-zaka-dark text-center">
              Innovation Technologique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zaka-gray leading-relaxed text-center mb-6">
              ZakaMall utilise les dernières technologies pour offrir une expérience fluide et sécurisée :
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="text-sm">React & TypeScript</Badge>
              <Badge variant="secondary" className="text-sm">PostgreSQL</Badge>
              <Badge variant="secondary" className="text-sm">Stripe Payments</Badge>
              <Badge variant="secondary" className="text-sm">Cloudinary CDN</Badge>
              <Badge variant="secondary" className="text-sm">Redis Cache</Badge>
              <Badge variant="secondary" className="text-sm">WebSocket Real-time</Badge>
              <Badge variant="secondary" className="text-sm">Mobile Responsive</Badge>
              <Badge variant="secondary" className="text-sm">PWA Ready</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sustainability */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-zaka-dark text-center">
              Impact Social & Économique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-zaka-dark mb-3">
                  <i className="fas fa-seedling text-zaka-green mr-3"></i>
                  Développement Local
                </h3>
                <p className="text-zaka-gray leading-relaxed">
                  Nous soutenons l'économie locale en donnant aux entrepreneurs burkinabé 
                  les outils pour développer leur business en ligne et atteindre plus de clients.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-zaka-dark mb-3">
                  <i className="fas fa-users text-zaka-blue mr-3"></i>
                  Création d'Emplois
                </h3>
                <p className="text-zaka-gray leading-relaxed">
                  Notre plateforme crée des opportunités d'emploi pour les livreurs, 
                  développeurs et professionnels du marketing digital au Burkina Faso.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="text-center">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold text-zaka-dark mb-4">
              Rejoignez la Révolution du E-commerce au Burkina Faso
            </h3>
            <p className="text-zaka-gray mb-6 max-w-2xl mx-auto">
              Que vous soyez vendeur, client ou partenaire, ZakaMall vous offre 
              les outils et le support nécessaires pour réussir dans le commerce électronique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/register" 
                className="bg-zaka-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-zaka-orange/90 transition-colors"
              >
                <i className="fas fa-rocket mr-2"></i>
                Commencer Maintenant
              </a>
              <a 
                href="/contact" 
                className="border border-zaka-orange text-zaka-orange px-6 py-3 rounded-lg font-semibold hover:bg-zaka-orange hover:text-white transition-colors"
              >
                <i className="fas fa-envelope mr-2"></i>
                Nous Contacter
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}