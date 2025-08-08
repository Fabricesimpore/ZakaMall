import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DriverPending() {
  const { user } = useAuth();

  const handleContact = () => {
    window.open(
      "https://wa.me/22670000000?text=Bonjour, je suis en attente d'approbation pour mon compte livreur ZakaMall",
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-zaka-light">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clock text-3xl text-yellow-600"></i>
            </div>
            <CardTitle className="text-2xl">Demande en cours d'examen</CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div>
              <p className="text-lg text-gray-700 mb-4">
                Merci {user?.firstName} ! Votre demande de compte livreur a été reçue.
              </p>
              <p className="text-gray-600">
                Notre équipe examine actuellement votre dossier et vérifiera vos informations sous
                24-48 heures.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-zaka-dark mb-3">Processus de validation :</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-zaka-green rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-check text-white text-xs"></i>
                  </div>
                  <span className="text-sm">Demande soumise</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3 animate-pulse">
                    <i className="fas fa-hourglass text-white text-xs"></i>
                  </div>
                  <span className="text-sm">Vérification du permis de conduire (en cours)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-car text-white text-xs"></i>
                  </div>
                  <span className="text-sm text-gray-500">Contrôle du véhicule</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-phone text-white text-xs"></i>
                  </div>
                  <span className="text-sm text-gray-500">Entretien téléphonique</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-graduation-cap text-white text-xs"></i>
                  </div>
                  <span className="text-sm text-gray-500">Formation sur l'application</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">
                <i className="fas fa-info-circle mr-2"></i>
                Documents à préparer
              </h4>
              <ul className="text-sm text-orange-700 text-left space-y-1">
                <li>• Photos du permis de conduire (recto/verso)</li>
                <li>• Photos du véhicule (avant, arrière, côtés)</li>
                <li>• Carte grise du véhicule</li>
                <li>• Pièce d'identité (CNI ou passeport)</li>
              </ul>
            </div>

            <div className="bg-zaka-light p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Des questions ? Contactez-nous :</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleContact}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <i className="fab fa-whatsapp mr-2"></i>
                  WhatsApp
                </Button>
                <Button variant="outline">
                  <i className="fas fa-phone mr-2"></i>
                  +226 70 00 00 00
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Référence de demande : {user?.id?.substring(0, 8).toUpperCase()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
