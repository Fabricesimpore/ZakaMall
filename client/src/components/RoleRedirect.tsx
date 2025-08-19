import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface RoleRedirectProps {
  allowedRoles: string[];
  redirectTo?: string;
  children: React.ReactNode;
}

export default function RoleRedirect({ 
  allowedRoles, 
  redirectTo = "/", 
  children 
}: RoleRedirectProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      console.log(`Redirecting user with role ${user.role} from restricted area`);
      setLocation(redirectTo);
    }
  }, [user, isLoading, allowedRoles, redirectTo, setLocation]);

  // Don't render children if user doesn't have permission
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zaka-light">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zaka-orange"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null; // Component will redirect, don't show content
  }

  return <>{children}</>;
}