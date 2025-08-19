import { Link } from "wouter";
import Cart from "@/components/Cart";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/customer">
              <Button variant="ghost" className="mr-4">
                <i className="fas fa-arrow-left mr-2"></i>
                Continuer mes achats
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-zaka-dark">Mon panier</h1>
          </div>
          <div className="text-sm text-gray-500">
            <i className="fas fa-shield-alt mr-2"></i>
            Achat sécurisé
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <Cart onClose={() => window.history.back()} />
        </div>
      </div>
    </div>
  );
}
