import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";

export default function TestPayment() {
  const [step, setStep] = useState<"login" | "order" | "payment" | "success">("login");
  const [testOrderId, setTestOrderId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/test/login", {});
    },
    onSuccess: () => {
      setStep("order");
      toast({
        title: "Test utilisateur connecté",
        description: "Vous pouvez maintenant tester le système de paiement",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTestOrderMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/test/order", {
        amount: 25000, // 25,000 CFA test order
        items: [
          { name: "Produit Test 1", price: 15000, quantity: 1 },
          { name: "Produit Test 2", price: 8000, quantity: 1 },
          { name: "Frais de livraison", price: 2000, quantity: 1 },
        ],
      });
    },
    onSuccess: (data: any) => {
      setTestOrderId(data.orderId);
      setStep("payment");
      toast({
        title: "Commande test créée",
        description: `Commande ${data.orderId} prête pour le paiement`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = (paymentId: string, transactionId: string) => {
    setPaymentSuccess(true);
    setStep("success");
    toast({
      title: "Paiement réussi!",
      description: `Transaction ${transactionId} complétée avec succès`,
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Erreur de paiement",
      description: error,
      variant: "destructive",
    });
  };

  const resetTest = () => {
    setStep("login");
    setTestOrderId(null);
    setPaymentSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <i className="fas fa-credit-card mr-3 text-zaka-orange"></i>
              Test du système de paiement ZakaMall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <i className="fas fa-info-circle mr-2"></i>
                Interface de test pour valider les paiements Orange Money, Moov Money et paiement à
                la livraison
              </p>
            </div>
          </CardContent>
        </Card>

        {step === "login" && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 1: Connexion test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Créer un utilisateur test pour simuler le processus de commande complet.
              </p>
              <Button
                onClick={() => loginMutation.mutate()}
                disabled={loginMutation.isPending}
                className="w-full bg-zaka-blue hover:bg-zaka-blue"
              >
                {loginMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Connexion...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i>
                    Se connecter comme utilisateur test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "order" && (
          <Card>
            <CardHeader>
              <CardTitle>Étape 2: Création de commande test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Commande test:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Produit Test 1: 15,000 CFA</li>
                  <li>• Produit Test 2: 8,000 CFA</li>
                  <li>• Frais de livraison: 2,000 CFA</li>
                  <li className="font-semibold border-t pt-1 mt-2">Total: 25,000 CFA</li>
                </ul>
              </div>
              <Button
                onClick={() => createTestOrderMutation.mutate()}
                disabled={createTestOrderMutation.isPending}
                className="w-full bg-zaka-green hover:bg-zaka-green"
              >
                {createTestOrderMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Créer commande test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "payment" && testOrderId && (
          <div>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Étape 3: Test des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Commande <code className="bg-gray-100 px-2 py-1 rounded">{testOrderId}</code>{" "}
                  prête pour le paiement
                </p>
              </CardContent>
            </Card>

            <PaymentMethodSelector
              orderId={testOrderId}
              totalAmount={25000}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        )}

        {step === "success" && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-2xl text-green-600"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-800">
                Test de paiement réussi!
              </h3>
              <p className="text-gray-600 mb-6">
                Le système de paiement ZakaMall fonctionne correctement.
              </p>
              <Button onClick={resetTest} className="bg-zaka-blue hover:bg-zaka-blue">
                <i className="fas fa-redo mr-2"></i>
                Recommencer le test
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
