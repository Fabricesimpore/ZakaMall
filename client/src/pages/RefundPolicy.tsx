import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-zaka-light">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-zaka-dark text-center">
              Politique de Retour et Remboursement
            </CardTitle>
            <p className="text-center text-zaka-gray">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                1. Aperçu de la politique
              </h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Chez ZakaMall, votre satisfaction est notre priorité. Cette politique explique vos
                droits concernant les retours, échanges et remboursements de vos achats sur notre
                marketplace.
              </p>
              <div className="bg-zaka-light p-4 rounded-lg border-l-4 border-zaka-orange">
                <p className="text-zaka-dark font-medium">
                  <i className="fas fa-info-circle text-zaka-orange mr-2"></i>
                  Période de retour : 14 jours calendaires à partir de la date de livraison
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                2. Conditions de retour
              </h2>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">
                2.1 Produits éligibles au retour
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">
                    <i className="fas fa-check-circle mr-2"></i>
                    Retours acceptés
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Vêtements et accessoires</li>
                    <li>• Électronique (non déballé)</li>
                    <li>• Livres et médias</li>
                    <li>• Articles de maison</li>
                    <li>• Jouets et jeux</li>
                    <li>• Articles de sport</li>
                  </ul>
                </div>

                <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">
                    <i className="fas fa-times-circle mr-2"></i>
                    Retours non acceptés
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Produits alimentaires périssables</li>
                    <li>• Articles d'hygiène personnelle</li>
                    <li>• Sous-vêtements</li>
                    <li>• Produits personnalisés</li>
                    <li>• Cartes cadeaux</li>
                    <li>• Téléchargements numériques</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">
                2.2 État requis du produit
              </h3>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Produit dans son état d'origine et non utilisé</li>
                <li>Emballage d'origine conservé avec tous les accessoires</li>
                <li>Étiquettes et tags non retirés (pour les vêtements)</li>
                <li>Aucun signe d'usure ou de dommage</li>
                <li>Facture ou preuve d'achat fournie</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">3. Processus de retour</h2>

              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-zaka-dark mb-4">
                  <i className="fas fa-list-ol text-zaka-orange mr-2"></i>
                  Étapes à suivre
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-zaka-orange text-white">1</Badge>
                    <div>
                      <p className="font-medium text-zaka-dark">Initiez votre demande</p>
                      <p className="text-sm text-zaka-gray">
                        Connectez-vous à votre compte → "Mes Commandes" → "Demander un retour"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Badge className="bg-zaka-orange text-white">2</Badge>
                    <div>
                      <p className="font-medium text-zaka-dark">Sélectionnez la raison</p>
                      <p className="text-sm text-zaka-gray">
                        Choisissez le motif de retour et ajoutez des photos si nécessaire
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Badge className="bg-zaka-orange text-white">3</Badge>
                    <div>
                      <p className="font-medium text-zaka-dark">Recevez les instructions</p>
                      <p className="text-sm text-zaka-gray">
                        Nous vous enverrons l'adresse de retour et l'étiquette prépayée (si
                        applicable)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Badge className="bg-zaka-orange text-white">4</Badge>
                    <div>
                      <p className="font-medium text-zaka-dark">Expédiez le produit</p>
                      <p className="text-sm text-zaka-gray">
                        Emballez soigneusement et expédiez via le transporteur indiqué
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Badge className="bg-zaka-orange text-white">5</Badge>
                    <div>
                      <p className="font-medium text-zaka-dark">Suivi et traitement</p>
                      <p className="text-sm text-zaka-gray">
                        Suivez votre retour et recevez votre remboursement après inspection
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">4. Frais de retour</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-700">
                      <i className="fas fa-gift mr-2"></i>
                      Retour gratuit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-zaka-gray space-y-2">
                      <li>• Produit défectueux ou endommagé</li>
                      <li>• Erreur de livraison (mauvais produit)</li>
                      <li>• Description non conforme</li>
                      <li>• Commandes &gt; 25,000 FCFA</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-orange-700">
                      <i className="fas fa-truck mr-2"></i>
                      Frais à votre charge
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-zaka-gray space-y-2">
                      <li>• Changement d'avis</li>
                      <li>• Taille/couleur incorrecte</li>
                      <li>• Commandes &lt; 25,000 FCFA</li>
                      <li>• Frais standard : 1,500-3,000 FCFA</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                5. Délais de remboursement
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-mobile-alt text-zaka-green text-xl"></i>
                    <span className="font-medium text-zaka-dark">Orange Money / Moov Money</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">2-3 jours ouvrables</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-credit-card text-zaka-blue text-xl"></i>
                    <span className="font-medium text-zaka-dark">Carte bancaire</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">5-7 jours ouvrables</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-university text-zaka-orange text-xl"></i>
                    <span className="font-medium text-zaka-dark">Virement bancaire</span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">7-10 jours ouvrables</Badge>
                </div>
              </div>

              <p className="text-sm text-zaka-gray mt-4">
                <i className="fas fa-info-circle text-zaka-orange mr-2"></i>
                Les délais commencent après réception et validation de votre retour par notre
                équipe.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">6. Échanges</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Les échanges sont possibles pour :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-4">
                <li>Changement de taille ou couleur (même produit)</li>
                <li>Produit de valeur équivalente ou supérieure</li>
                <li>Si le produit de remplacement est plus cher, payez la différence</li>
                <li>Si moins cher, recevez un avoir utilisable sur ZakaMall</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">
                  <i className="fas fa-lightbulb mr-2"></i>
                  Astuce : L'échange est souvent plus rapide que le retour-remboursement !
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">7. Cas particuliers</h2>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">7.1 Produits défectueux</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                En cas de produit défectueux, nous prenons en charge :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-6">
                <li>Tous les frais de retour</li>
                <li>Remboursement intégral ou échange gratuit</li>
                <li>Dédommagement si applicable</li>
                <li>Traitement prioritaire (24-48h)</li>
              </ul>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">7.2 Erreurs de livraison</h3>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Si vous recevez un mauvais produit :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Contactez-nous immédiatement</li>
                <li>Gardez le produit reçu en attendant nos instructions</li>
                <li>Nous organisons la récupération gratuitement</li>
                <li>Livraison du bon produit en priorité</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                8. Litiges et réclamations
              </h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                En cas de désaccord sur un retour :
              </p>
              <ol className="list-decimal list-inside text-zaka-gray space-y-2">
                <li>Contactez d'abord notre service client</li>
                <li>Nous examinerons votre cas dans les 48h</li>
                <li>Médiation possible avec le vendeur</li>
                <li>Décision finale communiquée par écrit</li>
                <li>Recours possible selon la législation en vigueur</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                9. Conseils pour éviter les retours
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-zaka-dark mb-3">Avant d'acheter :</h4>
                  <ul className="text-sm text-zaka-gray space-y-1">
                    <li>• Lisez attentivement la description</li>
                    <li>• Vérifiez les dimensions/tailles</li>
                    <li>• Consultez les avis clients</li>
                    <li>• Regardez toutes les photos</li>
                    <li>• Contactez le vendeur si doute</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-zaka-dark mb-3">Après réception :</h4>
                  <ul className="text-sm text-zaka-gray space-y-1">
                    <li>• Inspectez le produit immédiatement</li>
                    <li>• Testez si applicable</li>
                    <li>• Conservez l'emballage 14 jours</li>
                    <li>• Signalez tout problème rapidement</li>
                    <li>• Laissez un avis pour aider autres acheteurs</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">10. Contact et support</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Notre équipe retours/remboursements est disponible pour vous aider :
              </p>
              <div className="bg-zaka-light p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-zaka-dark mb-2">Service Retours</p>
                    <p className="text-sm text-zaka-gray">Email : retours@zakamall.com</p>
                    <p className="text-sm text-zaka-gray">Téléphone : +226 XX XX XX XX</p>
                    <p className="text-sm text-zaka-gray">Chat en ligne : Disponible 9h-18h</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zaka-dark mb-2">Horaires</p>
                    <p className="text-sm text-zaka-gray">Lundi - Vendredi : 8h00 - 18h00</p>
                    <p className="text-sm text-zaka-gray">Samedi : 9h00 - 16h00</p>
                    <p className="text-sm text-zaka-gray">Dimanche : Fermé</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="bg-zaka-orange bg-opacity-10 border border-zaka-orange p-6 rounded-lg text-center">
              <p className="text-zaka-dark font-medium mb-2">
                <i className="fas fa-heart text-zaka-orange mr-2"></i>
                Votre satisfaction est notre priorité
              </p>
              <p className="text-zaka-gray text-sm">
                Cette politique peut être modifiée. Les changements importants seront communiqués à
                l'avance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
