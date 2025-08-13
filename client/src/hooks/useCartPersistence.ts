import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CartItem {
  productId: string;
  quantity: number;
  addedAt: number;
}

const CART_STORAGE_KEY = "zakamall_cart_backup";
const CART_CLEARED_KEY = "zakamall_cart_cleared";
const MAX_CART_AGE_DAYS = 30;

export function useCartPersistence() {
  const queryClient = useQueryClient();

  // Get cart from server
  const { data: serverCart = [] } = useQuery({
    queryKey: ["/api/cart"],
    retry: 1,
  }) as { data: any[] };

  // Sync local cart to server
  const syncToServerMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      const promises = items.map((item) =>
        apiRequest("POST", "/api/cart", {
          productId: item.productId,
          quantity: item.quantity,
        })
      );
      return Promise.allSettled(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  // Save cart to localStorage
  const saveCartToLocal = useCallback((cartItems: any[]) => {
    try {
      const cartData = {
        items: cartItems.map((item) => ({
          productId: item.productId || item.product?.id,
          quantity: item.quantity,
          addedAt: Date.now(),
        })),
        lastUpdated: Date.now(),
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.warn("Failed to save cart to localStorage:", error);
    }
  }, []);

  // Load cart from localStorage
  const loadCartFromLocal = useCallback((): CartItem[] => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];

      const cartData = JSON.parse(stored);
      const now = Date.now();
      const maxAge = MAX_CART_AGE_DAYS * 24 * 60 * 60 * 1000;

      // Check if cart is too old
      if (now - cartData.lastUpdated > maxAge) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return [];
      }

      return cartData.items || [];
    } catch (error) {
      console.warn("Failed to load cart from localStorage:", error);
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  }, []);

  // Check if cart was recently cleared intentionally
  const wasCartRecentlyCleared = useCallback(() => {
    try {
      const clearedTimestamp = localStorage.getItem(CART_CLEARED_KEY);
      if (!clearedTimestamp) return false;
      
      const timeSinceCleared = Date.now() - parseInt(clearedTimestamp);
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (timeSinceCleared < fiveMinutes) {
        return true; // Cart was cleared recently, don't restore
      } else {
        // Clear the flag if enough time has passed
        localStorage.removeItem(CART_CLEARED_KEY);
        return false;
      }
    } catch {
      return false;
    }
  }, []);

  // Restore cart when user logs in or page loads
  const restoreCart = useCallback(async () => {
    // Don't restore if cart was recently cleared
    if (wasCartRecentlyCleared()) {
      return;
    }

    const localCart = loadCartFromLocal();

    if (localCart.length > 0 && Array.isArray(serverCart) && serverCart.length === 0) {
      // User has local cart but empty server cart - sync to server
      await syncToServerMutation.mutateAsync(localCart);

      // Clear local cart after successful sync
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [wasCartRecentlyCleared, loadCartFromLocal, serverCart, syncToServerMutation]);

  // Auto-save cart when server cart changes
  useEffect(() => {
    if (Array.isArray(serverCart) && serverCart.length > 0) {
      saveCartToLocal(serverCart);
      // Clear the "cleared" flag when items are added back to cart
      localStorage.removeItem(CART_CLEARED_KEY);
    }
  }, [serverCart, saveCartToLocal]);

  // Add item to local cart (for offline use)
  const addToLocalCart = useCallback(
    (productId: string, quantity: number = 1) => {
      const localCart = loadCartFromLocal();
      const existingIndex = localCart.findIndex((item) => item.productId === productId);

      let updatedCart;
      if (existingIndex >= 0) {
        updatedCart = [...localCart];
        updatedCart[existingIndex].quantity += quantity;
      } else {
        updatedCart = [...localCart, { productId, quantity, addedAt: Date.now() }];
      }

      const cartData = {
        items: updatedCart,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      // Clear the "cleared" flag when adding items
      localStorage.removeItem(CART_CLEARED_KEY);

      return updatedCart;
    },
    [loadCartFromLocal]
  );

  // Clear local cart and mark as intentionally cleared
  const clearLocalCart = useCallback(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    // Mark cart as intentionally cleared to prevent auto-restoration
    localStorage.setItem(CART_CLEARED_KEY, Date.now().toString());
  }, []);

  return {
    saveCartToLocal,
    loadCartFromLocal,
    restoreCart,
    addToLocalCart,
    clearLocalCart,
    isRestoring: syncToServerMutation.isPending,
  };
}
