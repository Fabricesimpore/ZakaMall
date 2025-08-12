import { useCallback } from "react";

interface SearchEvent {
  query: string;
  timestamp: number;
  resultsCount?: number;
  filters?: Record<string, any>;
  selectedSuggestion?: boolean;
}

export function useSearchAnalytics() {
  const trackSearch = useCallback(async (event: SearchEvent) => {
    try {
      // Send to analytics endpoint
      await fetch("/api/analytics/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...event,
          sessionId: getSessionId(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      // Also store locally for offline analytics
      const localAnalytics = getLocalAnalytics();
      localAnalytics.searches.push(event);

      // Keep only last 100 searches locally
      if (localAnalytics.searches.length > 100) {
        localAnalytics.searches = localAnalytics.searches.slice(-100);
      }

      localStorage.setItem("zakamall_analytics", JSON.stringify(localAnalytics));
    } catch (error) {
      console.warn("Failed to track search analytics:", error);
    }
  }, []);

  const trackProductView = useCallback(async (productId: string, source: string = "search") => {
    try {
      await fetch("/api/analytics/product-view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          source,
          timestamp: Date.now(),
          sessionId: getSessionId(),
        }),
      });
    } catch (error) {
      console.warn("Failed to track product view:", error);
    }
  }, []);

  const getPopularSearches = useCallback(() => {
    const analytics = getLocalAnalytics();
    const searchCounts = analytics.searches.reduce(
      (acc, search) => {
        acc[search.query] = (acc[search.query] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(searchCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }, []);

  return {
    trackSearch,
    trackProductView,
    getPopularSearches,
  };
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem("zakamall_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("zakamall_session_id", sessionId);
  }
  return sessionId;
}

function getLocalAnalytics() {
  const stored = localStorage.getItem("zakamall_analytics");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to default
    }
  }

  return {
    searches: [],
    productViews: [],
    lastUpdated: Date.now(),
  };
}
