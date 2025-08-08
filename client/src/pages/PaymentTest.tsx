import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaymentModal from "@/components/PaymentModal";
import { useToast } from "@/hooks/use-toast";

export default function PaymentTest() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [testOrderId, setTestOrderId] = useState("");
  const [testAmount, setTestAmount] = useState(25000);
  const { toast } = useToast();

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast({
      title: "Test réussi !",
      description: "L'intégration de paiement fonctionne correctement",
    });
  };

  const createTestOrder = async () => {
    try {
      const response = await fetch("/api/test/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: testAmount,
          items: [{ quantity: 1, price: testAmount }],
        }),
      });

      const result = await response.json();
      if (result.success) {
        setTestOrderId(result.orderId);
        setShowPaymentModal(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer la commande de test",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la commande de test",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-zaka-dark">
            Test d'intégration paiement ZakaMall
          </h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Configuration requise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Variables d'environnement requises
                </h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>
                    <strong>Orange Money:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>ORANGE_MONEY_MERCHANT_CODE</li>
                    <li>ORANGE_MONEY_API_KEY</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Moov Money:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>MOOV_MONEY_MERCHANT_ID</li>
                    <li>MOOV_MONEY_API_KEY</li>
                    <li>MOOV_MONEY_API_SECRET</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  <i className="fas fa-info-circle mr-2"></i>
                  Instructions
                </h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>1. Configurez vos variables d'environnement avec les vraies clés API</p>
                  <p>2. Créez une commande de test ci-dessous</p>
                  <p>3. Testez les différentes méthodes de paiement</p>
                  <p>4. Vérifiez que les webhooks reçoivent les notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test de paiement en direct</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant de test (CFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={createTestOrder}
                  className="w-full bg-zaka-orange hover:bg-zaka-orange/90 text-white"
                  size="lg"
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Créer commande de test et payer
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Méthodes de paiement disponibles:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-bold">OM</span>
                    </div>
                    <h4 className="font-medium">Orange Money</h4>
                    <p className="text-sm text-gray-600">API Orange Money Burkina Faso</p>
                  </div>

                  <div className="p-4 border rounded-lg text-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-white font-bold">MM</span>
                    </div>
                    <h4 className="font-medium">Moov Money</h4>
                    <p className="text-sm text-gray-600">API Moov Africa Burkina Faso</p>
                  </div>

                  <div className="p-4 border rounded-lg text-center">
                    <div className="w-12 h-12 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <i className="fas fa-money-bill-wave text-white"></i>
                    </div>
                    <h4 className="font-medium">Paiement à la livraison</h4>
                    <p className="text-sm text-gray-600">Paiement en espèces</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">URLs de webhook configurées:</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Orange Money:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4">
                    <li>/api/payments/orange-money/notify</li>
                    <li>/api/payments/orange-money/callback</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Moov Money:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4">
                    <li>/api/payments/moov-money/callback</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Modal */}
          {testOrderId && (
            <PaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              orderId={testOrderId}
              totalAmount={testAmount}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
