import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zaka-light">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-zaka-dark text-center">
              Politique de Confidentialité
            </CardTitle>
            <p className="text-center text-zaka-gray">
              Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">1. Introduction</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                ZakaMall ("nous", "notre" ou "nos") s'engage à protéger votre vie privée. Cette
                politique de confidentialité explique comment nous collectons, utilisons, divulguons
                et protégeons vos informations lorsque vous utilisez notre marketplace en ligne.
              </p>
              <p className="text-zaka-gray leading-relaxed">
                En utilisant nos services, vous acceptez les pratiques décrites dans cette
                politique.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                2. Informations que nous collectons
              </h2>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">
                2.1 Informations personnelles
              </h3>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-4">
                <li>Nom et prénom</li>
                <li>Adresse e-mail</li>
                <li>Numéro de téléphone</li>
                <li>Adresse de livraison et de facturation</li>
                <li>Informations de paiement (traitées de manière sécurisée par Stripe)</li>
              </ul>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">
                2.2 Informations d'utilisation
              </h3>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mb-4">
                <li>Historique de navigation et de recherche</li>
                <li>Produits consultés et commandes passées</li>
                <li>Préférences et paramètres du compte</li>
                <li>Interactions avec le service client</li>
              </ul>

              <h3 className="text-xl font-medium text-zaka-dark mb-3">
                2.3 Informations techniques
              </h3>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Adresse IP et données de géolocalisation</li>
                <li>Type et version du navigateur</li>
                <li>Système d'exploitation</li>
                <li>Cookies et technologies similaires</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                3. Comment nous utilisons vos informations
              </h2>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Traiter et gérer vos commandes</li>
                <li>Communiquer avec vous concernant vos achats</li>
                <li>Personnaliser votre expérience d'achat</li>
                <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
                <li>Prévenir la fraude et assurer la sécurité</li>
                <li>Respecter nos obligations légales</li>
                <li>Envoyer des notifications marketing (avec votre consentement)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                4. Partage de vos informations
              </h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos
                informations dans les cas suivants :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Avec les vendeurs pour traiter vos commandes</li>
                <li>Avec nos prestataires de services (paiement, livraison, etc.)</li>
                <li>Pour se conformer aux obligations légales</li>
                <li>Pour protéger nos droits et ceux de nos utilisateurs</li>
                <li>Avec votre consentement explicite</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                5. Sécurité des données
              </h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Nous mettons en place des mesures techniques et organisationnelles appropriées pour
                protéger vos données :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>Chiffrement des données sensibles (HTTPS/TLS)</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Surveillance continue de la sécurité</li>
                <li>Audits réguliers de sécurité</li>
                <li>Formation du personnel sur la protection des données</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">6. Vos droits</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Conformément aux lois applicables, vous avez les droits suivants :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>
                  <strong>Accès :</strong> Demander une copie de vos données personnelles
                </li>
                <li>
                  <strong>Rectification :</strong> Corriger les informations inexactes
                </li>
                <li>
                  <strong>Suppression :</strong> Demander la suppression de vos données
                </li>
                <li>
                  <strong>Portabilité :</strong> Recevoir vos données dans un format portable
                </li>
                <li>
                  <strong>Opposition :</strong> Vous opposer au traitement de vos données
                </li>
                <li>
                  <strong>Limitation :</strong> Limiter le traitement de vos données
                </li>
              </ul>
              <p className="text-zaka-gray leading-relaxed mt-4">
                Pour exercer ces droits, contactez-nous à :{" "}
                <a href="mailto:privacy@zakamall.com" className="text-zaka-orange hover:underline">
                  privacy@zakamall.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                7. Cookies et technologies similaires
              </h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Nous utilisons des cookies pour améliorer votre expérience :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2">
                <li>
                  <strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site
                </li>
                <li>
                  <strong>Cookies de performance :</strong> Analysent l'utilisation du site
                </li>
                <li>
                  <strong>Cookies fonctionnels :</strong> Mémorisent vos préférences
                </li>
                <li>
                  <strong>Cookies marketing :</strong> Personnalisent la publicité (avec
                  consentement)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                8. Conservation des données
              </h2>
              <p className="text-zaka-gray leading-relaxed">
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir
                nos services et respecter nos obligations légales. Les critères de conservation
                incluent :
              </p>
              <ul className="list-disc list-inside text-zaka-gray space-y-2 mt-4">
                <li>Tant que votre compte est actif</li>
                <li>Pour respecter les obligations légales et fiscales</li>
                <li>Pour résoudre les litiges</li>
                <li>Pour des raisons de sécurité et de prévention de la fraude</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                9. Transferts internationaux
              </h2>
              <p className="text-zaka-gray leading-relaxed">
                Vos données peuvent être transférées et stockées dans des pays autres que le Burkina
                Faso. Nous nous assurons que tous les transferts respectent les standards de
                protection appropriés.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                10. Protection des mineurs
              </h2>
              <p className="text-zaka-gray leading-relaxed">
                Nos services ne sont pas destinés aux enfants de moins de 16 ans. Nous ne collectons
                pas intentionnellement de données personnelles d'enfants de moins de 16 ans.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">
                11. Modifications de cette politique
              </h2>
              <p className="text-zaka-gray leading-relaxed">
                Nous pouvons mettre à jour cette politique de confidentialité. Les modifications
                importantes seront communiquées par e-mail ou via une notification sur notre site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-zaka-dark mb-4">12. Contact</h2>
              <p className="text-zaka-gray leading-relaxed mb-4">
                Pour toute question concernant cette politique de confidentialité :
              </p>
              <div className="bg-zaka-light p-4 rounded-lg">
                <p className="text-zaka-dark mb-2">
                  <strong>ZakaMall</strong>
                </p>
                <p className="text-zaka-gray">
                  Email :{" "}
                  <a
                    href="mailto:privacy@zakamall.com"
                    className="text-zaka-orange hover:underline"
                  >
                    privacy@zakamall.com
                  </a>
                </p>
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
