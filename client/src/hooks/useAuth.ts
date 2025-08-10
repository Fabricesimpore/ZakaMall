import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const {
    data: user,
    isLoading,
    error,
    isInitialLoading,
  } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Return null for unauthorized instead of throwing
        }
        console.error(`Auth error: ${response.status} ${response.statusText}`);
        throw new Error(`Erreur ${response.status}: Impossible de récupérer les informations utilisateur`);
      }
      const userData = await response.json();
      console.log("User data loaded:", userData);
      return userData;
    },
  });

  return {
    user,
    isLoading: isLoading || isInitialLoading,
    isAuthenticated: !!user && !error,
  };
}
