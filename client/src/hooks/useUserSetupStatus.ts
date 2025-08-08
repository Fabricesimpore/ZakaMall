import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface SetupStatus {
  hasVendorProfile: boolean;
  hasDriverProfile: boolean;
  vendorStatus: string | null;
  driverStatus: string | null;
}

export function useUserSetupStatus() {
  const { user, isAuthenticated } = useAuth();

  const { data: setupStatus, isLoading } = useQuery<SetupStatus>({
    queryKey: ["/api/auth/setup-status"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  const needsSetup = (): boolean => {
    if (!user || !setupStatus) return false;

    // Customers don't need additional setup
    if (user.role === "customer") return false;

    // Vendors need setup if they don't have a vendor record or it's pending
    if (user.role === "vendor") {
      return !setupStatus.hasVendorProfile || setupStatus.vendorStatus === "pending";
    }

    // Drivers need setup if they don't have a driver record or it's pending
    if (user.role === "driver") {
      return !setupStatus.hasDriverProfile || setupStatus.driverStatus === "pending";
    }

    return false;
  };

  const getRedirectPath = (): string => {
    if (!user || !setupStatus) return "/";

    if (user.role === "vendor") {
      if (!setupStatus.hasVendorProfile) return "/vendor-setup";
      if (setupStatus.vendorStatus === "pending") return "/vendor-pending";
      return "/vendor";
    }

    if (user.role === "driver") {
      if (!setupStatus.hasDriverProfile) return "/driver-setup";
      if (setupStatus.driverStatus === "pending") return "/driver-pending";
      return "/driver";
    }

    return "/customer";
  };

  return {
    setupStatus,
    isLoading,
    needsSetup: needsSetup(),
    redirectPath: getRedirectPath(),
  };
}
