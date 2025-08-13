import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useCallback, useRef } from "react";

interface TrackBehaviorParams {
  productId: string;
  actionType: "view" | "add_to_cart" | "purchase" | "like" | "share" | "search_click";
  duration?: number;
  metadata?: Record<string, any>;
}

export function useUserBehaviorTracker() {
  const { user } = useAuth();
  const sessionId = useRef<string>();
  const viewStartTimes = useRef<Map<string, number>>(new Map());

  // Generate session ID on first use
  if (!sessionId.current) {
    sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const trackBehavior = useCallback(
    async (params: TrackBehaviorParams) => {
      try {
        await apiRequest("POST", "/api/behavior/track", {
          userId: user?.id || null,
          sessionId: sessionId.current,
          ...params,
        });
      } catch (error) {
        console.error("Error tracking behavior:", error);
        // Fail silently to not disrupt user experience
      }
    },
    [user?.id]
  );

  // Track product view start
  const trackViewStart = useCallback((productId: string) => {
    viewStartTimes.current.set(productId, Date.now());
  }, []);

  // Track product view end with duration
  const trackViewEnd = useCallback(
    (productId: string, metadata?: Record<string, any>) => {
      const startTime = viewStartTimes.current.get(productId);
      const duration = startTime ? Date.now() - startTime : undefined;

      trackBehavior({
        productId,
        actionType: "view",
        duration,
        metadata,
      });

      viewStartTimes.current.delete(productId);
    },
    [trackBehavior]
  );

  // Track add to cart
  const trackAddToCart = useCallback(
    (productId: string, metadata?: Record<string, any>) => {
      trackBehavior({
        productId,
        actionType: "add_to_cart",
        metadata,
      });
    },
    [trackBehavior]
  );

  // Track purchase
  const trackPurchase = useCallback(
    (productId: string, metadata?: Record<string, any>) => {
      trackBehavior({
        productId,
        actionType: "purchase",
        metadata,
      });
    },
    [trackBehavior]
  );

  // Track like/favorite
  const trackLike = useCallback(
    (productId: string, metadata?: Record<string, any>) => {
      trackBehavior({
        productId,
        actionType: "like",
        metadata,
      });
    },
    [trackBehavior]
  );

  // Track share
  const trackShare = useCallback(
    (productId: string, metadata?: Record<string, any>) => {
      trackBehavior({
        productId,
        actionType: "share",
        metadata,
      });
    },
    [trackBehavior]
  );

  // Track search result click
  const trackSearchClick = useCallback(
    (productId: string, searchQuery?: string, position?: number) => {
      trackBehavior({
        productId,
        actionType: "search_click",
        metadata: {
          searchQuery,
          position,
        },
      });
    },
    [trackBehavior]
  );

  return {
    trackViewStart,
    trackViewEnd,
    trackAddToCart,
    trackPurchase,
    trackLike,
    trackShare,
    trackSearchClick,
  };
}
