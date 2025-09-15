import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import DarkModeProvider from "@/components/DarkModeProvider";
import { detectOverflow } from "@/utils/overflow-detector";
import { SkipToContent } from "@/components/a11y/skip-to-content";
import { ScrollRestoration } from "@/components/scroll-restoration";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import CustomerDashboard from "@/pages/CustomerDashboard";
import VendorDashboard from "@/pages/VendorDashboard";
import VendorInventoryPage from "@/pages/VendorInventoryPage";
import VendorOrdersPage from "@/pages/VendorOrdersPage";
import VendorAnalyticsPage from "@/pages/VendorAnalyticsPage";
import DriverDashboard from "@/pages/DriverDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProfile from "@/pages/AdminProfile";
import Profile from "@/pages/Profile";
import Chat from "@/pages/Chat";
import VendorSetup from "@/pages/VendorSetup";
import DriverSetup from "@/pages/DriverSetup";
import VendorPending from "@/pages/VendorPending";
import DriverPending from "@/pages/DriverPending";
import Products from "@/pages/Products";
import CartPage from "@/pages/CartPage";
import TestPayment from "@/pages/TestPayment";
import PaymentTest from "@/pages/PaymentTest";
import CreateAdmin from "@/pages/CreateAdmin";
import ProductForm from "@/pages/ProductForm";
import Register from "@/pages/Register";
import OrderTracking from "@/pages/OrderTracking";
import SearchPage from "@/pages/SearchPage";
import StorePage from "@/pages/StorePage";
import RestaurantFeed from "@/pages/RestaurantFeed";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Help from "@/pages/Help";
import RefundPolicy from "@/pages/RefundPolicy";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Enable overflow detector in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      detectOverflow(true);
    }
  }, []);

  // Show loading while auth is being determined to prevent 404 flash
  // This includes initial load and when user data is being fetched
  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zaka-light">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-zaka-orange bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="fas fa-shopping-bag text-2xl text-zaka-orange"></i>
            </div>
          </div>
          <p className="text-zaka-gray">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollRestoration />
      <main id="main" tabIndex={-1}>
        <Switch>
          {/* Public routes accessible to all users */}
          <Route path="/products" component={Products} />
          <Route path="/search" component={SearchPage} />
          <Route path="/restaurants" component={RestaurantFeed} />
          <Route path="/store/:slug" component={StorePage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/orders" component={OrderTracking} />
          <Route path="/test-payment" component={TestPayment} />
          <Route path="/payment-test" component={PaymentTest} />
          <Route path="/register" component={Register} />
          <Route path="/create-admin" component={CreateAdmin} />
          
          {/* Policy and information pages */}
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/help" component={Help} />
          <Route path="/refunds" component={RefundPolicy} />

          {/* Setup routes - accessible during post-registration flow */}
          <Route path="/vendor-setup" component={VendorSetup} />
          <Route path="/driver-setup" component={DriverSetup} />
          <Route path="/vendor-pending" component={VendorPending} />
          <Route path="/driver-pending" component={DriverPending} />

          {/* Admin routes - these will handle their own authentication internally */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/profile" component={AdminProfile} />

          {!isAuthenticated ? (
            <Route path="/" component={Landing} />
          ) : (
            <>
              <Route path="/" component={Home} />
              <Route path="/customer" component={CustomerDashboard} />
              <Route path="/vendor" component={VendorDashboard} />
              <Route path="/vendor/dashboard" component={VendorDashboard} />
              <Route path="/vendor/products/new" component={() => <ProductForm />} />
              <Route path="/vendor/products/:id/edit">
                {(params) => <ProductForm productId={params.id} />}
              </Route>
              <Route path="/vendor/inventory" component={VendorInventoryPage} />
              <Route path="/vendor/orders" component={VendorOrdersPage} />
              <Route path="/vendor/analytics" component={VendorAnalyticsPage} />
              <Route path="/driver" component={DriverDashboard} />
              <Route path="/profile" component={Profile} />
              <Route path="/chat" component={Chat} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </main>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <TooltipProvider>
          <SkipToContent />
          <Toaster />
          <Router />
        </TooltipProvider>
      </DarkModeProvider>
    </QueryClientProvider>
  );
}

export default App;
