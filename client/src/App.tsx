import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import CustomerDashboard from "@/pages/CustomerDashboard";
import VendorDashboard from "@/pages/VendorDashboard";
import VendorInventoryPage from "@/pages/VendorInventoryPage";
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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show nothing while loading to prevent 404 flash
  if (isLoading) {
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
    <Switch>
      {/* Public routes accessible to all users */}
      <Route path="/products" component={Products} />
      <Route path="/cart" component={CartPage} />
      <Route path="/orders" component={OrderTracking} />
      <Route path="/test-payment" component={TestPayment} />
      <Route path="/payment-test" component={PaymentTest} />
      <Route path="/register" component={Register} />
      <Route path="/create-admin" component={CreateAdmin} />
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
          <Route path="/vendor/orders" component={VendorDashboard} />
          <Route path="/vendor/analytics" component={VendorDashboard} />
          <Route path="/driver" component={DriverDashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/chat" component={Chat} />
          <Route path="/vendor-setup" component={VendorSetup} />
          <Route path="/driver-setup" component={DriverSetup} />
          <Route path="/vendor-pending" component={VendorPending} />
          <Route path="/driver-pending" component={DriverPending} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
