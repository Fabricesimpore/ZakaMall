import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  price: string;
  images: string[] | null;
  viewedAt: number;
}

const MAX_RECENT_ITEMS = 10;
const STORAGE_KEY = "zakamall_recently_viewed";

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sort by viewedAt descending and take only valid items
        const validItems = parsed
          .filter((item: any) => item.id && item.name && item.viewedAt)
          .sort((a: Product, b: Product) => b.viewedAt - a.viewedAt)
          .slice(0, MAX_RECENT_ITEMS);
        setRecentlyViewed(validItems);
      } catch (error) {
        console.error("Error parsing recently viewed products:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const addToRecentlyViewed = (product: Omit<Product, "viewedAt">) => {
    const newItem: Product = {
      ...product,
      viewedAt: Date.now(),
    };

    setRecentlyViewed((prev) => {
      // Remove existing item if present
      const filtered = prev.filter((item) => item.id !== product.id);
      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  const removeFromRecentlyViewed = (productId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item.id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
  };
}
