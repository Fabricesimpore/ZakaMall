"use client";
import { useEffect, useMemo } from "react";

interface UseInfiniteScrollProps {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

export function useInfiniteScroll({
  hasNextPage,
  isLoading,
  onLoadMore,
  threshold = 200,
}: UseInfiniteScrollProps) {
  const onScroll = useMemo(() => {
    let ticking = false;

    return () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          const isNearBottom = scrollTop + windowHeight >= documentHeight - threshold;

          if (isNearBottom && hasNextPage && !isLoading) {
            onLoadMore();
          }

          ticking = false;
        });
        ticking = true;
      }
    };
  }, [hasNextPage, isLoading, onLoadMore, threshold]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);
}
