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
import DriverDashboard from "@/pages/DriverDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Profile from "@/pages/Profile";
import Chat from "@/pages/Chat";
import VendorSetup from "@/pages/VendorSetup";
import DriverSetup from "@/pages/DriverSetup";
import VendorPending from "@/pages/VendorPending";
import DriverPending from "@/pages/DriverPending";
import Products from "@/pages/Products";
import CartPage from "@/pages/CartPage";
import TestPayment from "@/pages/TestPayment";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes accessible to all users */}
      <Route path="/products" component={Products} />
      <Route path="/cart" component={CartPage} />
      <Route path="/test-payment" component={TestPayment} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/customer" component={CustomerDashboard} />
          <Route path="/vendor" component={VendorDashboard} />
          <Route path="/driver" component={DriverDashboard} />
          <Route path="/admin" component={AdminDashboard} />
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
