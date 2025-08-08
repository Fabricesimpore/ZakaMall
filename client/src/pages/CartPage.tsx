import { Link } from "wouter";
import Cart from "@/components/Cart";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/products">
            <Button variant="ghost" className="mr-4">
              <i className="fas fa-arrow-left mr-2"></i>
              Retour aux produits
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-zaka-dark">Mon panier</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <Cart onClose={() => window.history.back()} />
        </div>
      </div>
    </div>
  );
}
