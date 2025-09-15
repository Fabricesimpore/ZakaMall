import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-zaka-light">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-zaka-dark text-center">
              Conditions d'Utilisation
            </CardTitle>
            <p className="text-center text-zaka-gray">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">1. Acceptation des conditions</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                En accédant et en utilisant ZakaMall, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces termes, veuillez ne pas utiliser nos services.
              </p>
              <p className="text-zaka-gray leading-relaxed">
                Ces conditions constituent un accord légalement contraignant entre vous et ZakaMall concernant votre utilisation de notre marketplace.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">2. Description des services</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                ZakaMall est une plateforme de marketplace en ligne qui permet :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Aux clients d'acheter des produits auprès de vendeurs vérifiés</li>
                <li>Aux vendeurs de présenter et vendre leurs produits</li>
                <li>Aux livreurs de fournir des services de livraison</li>
                <li>Le traitement sécurisé des paiements</li>
                <li>Des services de support client</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">3. Éligibilité et inscription</h2>
              
              <h3 className="text-xl font-medium text-zaka-dark mb-3">3.1 Conditions d'éligibilité</h3>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-4">
                <li>Vous devez avoir au moins 18 ans</li>
                <li>Avoir la capacité juridique de conclure des contrats</li>
                <li>Fournir des informations exactes et complètes</li>
                <li>Ne pas être suspendu ou banni de la plateforme</li>
              </ul>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">3.2 Responsabilité du compte</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Vous êtes responsable de :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Maintenir la confidentialité de vos identifiants</li>
                <li>Toutes les activités sur votre compte</li>
                <li>Notifier immédiatement tout usage non autorisé</li>
                <li>Tenir vos informations à jour</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">4. Règles d'utilisation</h2>
              
              <h3 className="text-xl font-medium text-zaka-dark mb-3">4.1 Utilisations autorisées</h3>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-4">
                <li>Naviguer et acheter des produits légitimes</li>
                <li>Créer et gérer votre compte</li>
                <li>Communiquer avec les vendeurs et le support</li>
                <li>Laisser des avis honnêtes et constructifs</li>
              </ul>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">4.2 Comportements interdits</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Il est strictement interdit de :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Violer les lois locales ou internationales</li>
                <li>Usurper l'identité d'autrui</li>
                <li>Publier du contenu offensant, illégal ou trompeur</li>
                <li>Tenter d'accéder aux comptes d'autres utilisateurs</li>
                <li>Distribuer des virus ou codes malveillants</li>
                <li>Manipuler les avis ou évaluations</li>
                <li>Harceler ou menacer d'autres utilisateurs</li>
                <li>Utiliser des robots ou scripts automatisés</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">5. Transactions et paiements</h2>
              
              <h3 className="text-xl font-medium text-zaka-dark mb-3">5.1 Conditions de vente</h3>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-4">
                <li>Les prix sont indiqués en francs CFA (XOF)</li>
                <li>Les commandes sont soumises à acceptation du vendeur</li>
                <li>Les produits doivent être disponibles en stock</li>
                <li>La livraison s'effectue selon les délais indiqués</li>
              </ul>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">5.2 Méthodes de paiement</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Nous acceptons :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Orange Money</li>
                <li>Moov Money</li>
                <li>Cartes bancaires (via Stripe)</li>
                <li>Paiement à la livraison (selon disponibilité)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">6. Politique de retour et remboursement</h2>
              
              <h3 className="text-xl font-medium text-zaka-dark mb-3">6.1 Droit de rétractation</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Vous disposez de 14 jours pour retourner un produit, sauf exceptions légales (produits périssables, personnalisés, etc.).
              </p>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">6.2 Conditions de retour</h3>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Produit dans son état d'origine</li>
                <li>Emballage original conservé</li>
                <li>Frais de retour à votre charge (sauf défaut)</li>
                <li>Remboursement sous 14 jours après réception</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">7. Propriété intellectuelle</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Tous les contenus de ZakaMall (logos, textes, images, codes) sont protégés par les droits de propriété intellectuelle. Il est interdit de :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Reproduire ou distribuer nos contenus sans autorisation</li>
                <li>Utiliser nos marques à des fins commerciales</li>
                <li>Créer des œuvres dérivées de nos contenus</li>
                <li>Extraire ou utiliser nos données à des fins concurrentielles</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">8. Responsabilité et garanties</h2>
              
              <h3 className="text-xl font-medium text-zaka-dark mb-3">8.1 Limitation de responsabilité</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                ZakaMall agit en tant qu'intermédiaire. Notre responsabilité est limitée à la fourniture de la plateforme. Nous ne sommes pas responsables de :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-4">
                <li>La qualité des produits vendus par les vendeurs</li>
                <li>Les dommages indirects ou consécutifs</li>
                <li>Les pertes de données ou d'exploitation</li>
                <li>Les actions des utilisateurs tiers</li>
              </ul>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">8.2 Garanties exclues</h3>
              <p className="text-zaka-gray leading-relaxed">
                Les services sont fournis "en l'état". Nous excluons toute garantie concernant la disponibilité continue, l'exactitude des informations ou l'absence d'erreurs.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">9. Suspension et résiliation</h2>
              
              <h3 className="text-xl font-medium text-zaka-dark mb-3">9.1 Suspension par ZakaMall</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Nous pouvons suspendre ou fermer votre compte en cas de :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-4">
                <li>Violation de ces conditions</li>
                <li>Activité frauduleuse ou suspecte</li>
                <li>Non-paiement des commissions (vendeurs)</li>
                <li>Plaintes répétées d'autres utilisateurs</li>
              </ul>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">9.2 Résiliation par l'utilisateur</h3>
              <p className="text-zaka-gray leading-relaxed">
                Vous pouvez fermer votre compte à tout moment depuis vos paramètres ou en nous contactant.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">10. Résolution des litiges</h2>
              
              <h3 className="text-xl font-medium text-zaka-dark mb-3">10.1 Médiation</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                En cas de litige, nous encourageons la résolution amiable via notre service client.
              </p>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">10.2 Juridiction</h3>
              <p className="text-zaka-gray leading-relaxed">
                Les présentes conditions sont régies par le droit burkinabé. Tout litige sera soumis aux tribunaux compétents de Ouagadougou.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">11. Modifications des conditions</h2>
              <p className="text-zaka-gray leading-relaxed">
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications importantes seront notifiées 30 jours à l'avance par e-mail ou via la plateforme.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">12. Dispositions générales</h2>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li><strong>Divisibilité :</strong> Si une clause est invalide, les autres restent applicables</li>
                <li><strong>Renonciation :</strong> Notre non-action ne constitue pas une renonciation à nos droits</li>
                <li><strong>Intégralité :</strong> Ces conditions constituent l'accord complet entre nous</li>
                <li><strong>Cession :</strong> Vous ne pouvez pas céder vos droits sans notre accord</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">13. Contact</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Pour toute question concernant ces conditions d'utilisation :
              </p>
              <div className="bg-zaka-light p-4 rounded-lg">
                <p className="text-zaka-dark mb-2"><strong>ZakaMall</strong></p>
                <p className="text-zaka-gray">Email : <a href="mailto:legal@zakamall.com" className="text-zaka-orange hover:underline">legal@zakamall.com</a></p>
                <p className="text-zaka-gray">Support : <a href="mailto:support@zakamall.com" className="text-zaka-orange hover:underline">support@zakamall.com</a></p>
                <p className="text-zaka-gray">Téléphone : +226 XX XX XX XX</p>
                <p className="text-zaka-gray">Adresse : Ouagadougou, Burkina Faso</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}