"use client";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function ScrollRestoration() {
  const [location] = useLocation();

  // Scroll to top on route changes (but keep hash behavior)
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location]);

  // Browser back/forward remember position automatically; nothing else needed.
  return null;
}
