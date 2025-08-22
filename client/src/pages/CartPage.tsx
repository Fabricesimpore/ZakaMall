import { Link } from "wouter";
import Cart from "@/components/Cart";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  return (
    <PageShell className="bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/customer">
              <Button variant="ghost" className="mb-2 sm:mb-0">
                <i className="fas fa-arrow-left mr-2"></i>
                <span className="hidden sm:inline">Continuer mes achats</span>
                <span className="sm:hidden">Retour</span>
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-zaka-dark break-words">Mon panier</h1>
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            <i className="fas fa-shield-alt mr-2"></i>
            <span className="hidden sm:inline">Achat sécurisé</span>
            <span className="sm:hidden">Sécurisé</span>
          </div>
        </div>

        <div className="w-full">
          <Cart onClose={() => window.history.back()} />
        </div>
      </div>
    </PageShell>
  );
}
