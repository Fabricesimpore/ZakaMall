import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      title: "Commandes & Achats",
      icon: "fas fa-shopping-cart",
      color: "text-zaka-blue",
      items: [
        {
          question: "Comment passer une commande sur ZakaMall ?",
          answer: "Pour passer une commande : 1) Créez un compte ou connectez-vous, 2) Parcourez les produits et ajoutez-les au panier, 3) Vérifiez votre panier, 4) Procédez au paiement en choisissant votre méthode préférée, 5) Confirmez votre adresse de livraison. Vous recevrez une confirmation par email."
        },
        {
          question: "Puis-je modifier ou annuler ma commande ?",
          answer: "Vous pouvez modifier ou annuler votre commande dans les 30 minutes suivant sa validation, tant qu'elle n'a pas été préparée par le vendeur. Rendez-vous dans 'Mes Commandes' ou contactez le support client."
        },
        {
          question: "Comment suivre ma commande ?",
          answer: "Après validation de votre commande, vous recevrez un numéro de suivi par SMS et email. Vous pouvez également suivre votre commande en temps réel dans la section 'Mes Commandes' de votre compte."
        },
        {
          question: "Que faire si je reçois un produit défectueux ?",
          answer: "En cas de produit défectueux, contactez-nous dans les 48h via le chat support ou par email. Nous organiserons un retour gratuit et un remboursement ou échange selon vos préférences."
        }
      ]
    },
    {
      title: "Paiements & Facturation",
      icon: "fas fa-credit-card",
      color: "text-zaka-green",
      items: [
        {
          question: "Quels moyens de paiement acceptez-vous ?",
          answer: "Nous acceptons : Orange Money, Moov Money, cartes bancaires Visa/Mastercard (via Stripe), et le paiement à la livraison dans certaines zones de Ouagadougou."
        },
        {
          question: "Mes données de paiement sont-elles sécurisées ?",
          answer: "Absolument. Nous utilisons le chiffrement SSL et Stripe pour sécuriser toutes les transactions. Vos données bancaires ne sont jamais stockées sur nos serveurs."
        },
        {
          question: "Comment obtenir une facture ?",
          answer: "Une facture électronique est automatiquement envoyée à votre email après chaque commande. Vous pouvez également la télécharger depuis votre espace client dans 'Mes Commandes'."
        },
        {
          question: "Que faire si mon paiement échoue ?",
          answer: "Vérifiez votre solde/limite, réessayez avec une autre méthode, ou contactez votre banque/opérateur mobile. Notre support peut aussi vous aider à résoudre le problème."
        }
      ]
    },
    {
      title: "Livraison & Expédition",
      icon: "fas fa-truck",
      color: "text-zaka-orange",
      items: [
        {
          question: "Quels sont les délais de livraison ?",
          answer: "Dans Ouagadougou : 24-48h pour la plupart des produits. Autres villes du Burkina : 3-7 jours. Les délais peuvent varier selon la disponibilité du produit et la distance."
        },
        {
          question: "Combien coûte la livraison ?",
          answer: "Ouagadougou centre : 500 FCFA, périphérie : 1000-1500 FCFA. Autres villes : 2000-5000 FCFA selon la distance. Livraison gratuite pour les commandes > 50,000 FCFA."
        },
        {
          question: "Livrez-vous partout au Burkina Faso ?",
          answer: "Nous livrons dans toutes les grandes villes : Ouagadougou, Bobo-Dioulasso, Koudougou, Banfora, Ouahigouya, Fada N'Gourma, et d'autres centres urbains. Contactez-nous pour les zones rurales."
        },
        {
          question: "Comment changer mon adresse de livraison ?",
          answer: "Vous pouvez modifier votre adresse de livraison avant expédition dans 'Mes Commandes'. Après expédition, contactez le livreur directement via l'app ou notre support."
        }
      ]
    },
    {
      title: "Compte & Profil",
      icon: "fas fa-user",
      color: "text-zaka-blue",
      items: [
        {
          question: "Comment créer un compte ZakaMall ?",
          answer: "Cliquez sur 'S'inscrire', choisissez votre type de compte (Client, Vendeur, Livreur), remplissez le formulaire avec vos informations, vérifiez votre email/téléphone, et c'est fait !"
        },
        {
          question: "J'ai oublié mon mot de passe, que faire ?",
          answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion, entrez votre email, consultez votre boîte mail pour le lien de réinitialisation, et créez un nouveau mot de passe."
        },
        {
          question: "Comment modifier mes informations personnelles ?",
          answer: "Connectez-vous à votre compte, allez dans 'Mon Profil', cliquez sur 'Modifier', mettez à jour vos informations, et sauvegardez. Certaines modifications peuvent nécessiter une vérification."
        },
        {
          question: "Comment supprimer mon compte ?",
          answer: "Pour supprimer votre compte, contactez notre support via email ou chat. Nous traiterons votre demande dans les 48h en respectant la protection de vos données personnelles."
        }
      ]
    },
    {
      title: "Vendeurs & Partenaires",
      icon: "fas fa-store",
      color: "text-zaka-green",
      items: [
        {
          question: "Comment devenir vendeur sur ZakaMall ?",
          answer: "Créez un compte vendeur, soumettez vos documents (CNI, registre de commerce), attendez la validation (2-5 jours), configurez votre boutique, et commencez à vendre ! Formation gratuite incluse."
        },
        {
          question: "Quelles sont les commissions de ZakaMall ?",
          answer: "Nos commissions varient de 5% à 15% selon la catégorie de produit et votre volume de ventes. Plus vous vendez, moins vous payez de commission. Transparence totale garantie."
        },
        {
          question: "Comment recevoir mes paiements en tant que vendeur ?",
          answer: "Les paiements sont versés hebdomadairement sur votre compte Orange Money, Moov Money, ou compte bancaire. Délai : 7 jours après livraison confirmée par le client."
        },
        {
          question: "Comment promouvoir mes produits ?",
          answer: "Utilisez nos outils promotionnels : photos de qualité, descriptions détaillées, prix compétitifs, promotions flash, et notre système de mise en avant payant pour plus de visibilité."
        }
      ]
    },
    {
      title: "Retours & Remboursements",
      icon: "fas fa-undo",
      color: "text-zaka-orange",
      items: [
        {
          question: "Quelle est votre politique de retour ?",
          answer: "Retours acceptés sous 14 jours pour les produits non-périssables, dans leur emballage d'origine. Frais de retour à votre charge sauf défaut produit. Remboursement sous 7-14 jours."
        },
        {
          question: "Comment demander un remboursement ?",
          answer: "Allez dans 'Mes Commandes', cliquez sur 'Demander un retour', sélectionnez la raison, suivez les instructions de retour. Notre équipe traitera votre demande rapidement."
        },
        {
          question: "Combien de temps pour recevoir mon remboursement ?",
          answer: "Remboursements traités sous 3-7 jours ouvrables après réception du produit retourné. Le délai dépend de votre méthode de paiement originale (mobile money plus rapide)."
        },
        {
          question: "Puis-je échanger un produit au lieu d'un remboursement ?",
          answer: "Oui, l'échange est possible pour un produit de même valeur ou supérieure (avec complément). Contactez le vendeur ou notre support pour organiser l'échange."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-zaka-light">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zaka-dark mb-4">
            Centre d'Aide
          </h1>
          <p className="text-xl text-zaka-gray max-w-3xl mx-auto mb-8">
            Trouvez rapidement les réponses à vos questions sur ZakaMall. 
            Notre équipe support est également disponible pour vous aider.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Input
              type="text"
              placeholder="Rechercher dans l'aide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-zaka-gray"></i>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="py-8">
              <div className="w-16 h-16 bg-zaka-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-comments text-2xl text-zaka-blue"></i>
              </div>
              <h3 className="font-semibold text-zaka-dark mb-2">Chat en Direct</h3>
              <p className="text-zaka-gray text-sm mb-4">
                Parlez directement avec notre équipe support
              </p>
              <span className="text-zaka-blue font-medium">Commencer le chat →</span>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="py-8">
              <div className="w-16 h-16 bg-zaka-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope text-2xl text-zaka-green"></i>
              </div>
              <h3 className="font-semibold text-zaka-dark mb-2">Envoyer un Email</h3>
              <p className="text-zaka-gray text-sm mb-4">
                Contactez-nous par email pour un support détaillé
              </p>
              <a href="/contact" className="text-zaka-green font-medium">
                Nous contacter →
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="py-8">
              <div className="w-16 h-16 bg-zaka-orange bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-phone text-2xl text-zaka-orange"></i>
              </div>
              <h3 className="font-semibold text-zaka-dark mb-2">Appeler</h3>
              <p className="text-zaka-gray text-sm mb-4">
                Support téléphonique du lundi au vendredi
              </p>
              <span className="text-zaka-orange font-medium">+226 XX XX XX XX</span>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filteredCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-zaka-dark">
                  <i className={`${category.icon} ${category.color} mr-3`}></i>
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${categoryIndex}-${itemIndex}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-zaka-gray leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {searchTerm && filteredCategories.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-zaka-dark mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-zaka-gray mb-6">
                Essayez avec d'autres mots-clés ou contactez notre support pour une aide personnalisée.
              </p>
              <a
                href="/contact"
                className="bg-zaka-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-zaka-orange/90 transition-colors"
              >
                Contacter le Support
              </a>
            </CardContent>
          </Card>
        )}

        {/* Contact CTA */}
        <Card className="mt-12 text-center">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold text-zaka-dark mb-4">
              Vous ne trouvez pas ce que vous cherchez ?
            </h3>
            <p className="text-zaka-gray mb-6">
              Notre équipe support est là pour vous aider avec toutes vos questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-zaka-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-zaka-orange/90 transition-colors"
              >
                <i className="fas fa-envelope mr-2"></i>
                Nous Contacter
              </a>
              <a
                href="tel:+22625XXXXXX"
                className="border border-zaka-orange text-zaka-orange px-6 py-3 rounded-lg font-semibold hover:bg-zaka-orange hover:text-white transition-colors"
              >
                <i className="fas fa-phone mr-2"></i>
                Appeler Maintenant
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}