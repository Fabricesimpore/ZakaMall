import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface SavedPaymentMethod {
  id: string;
  type: "orange_money" | "moov_money";
  phoneNumber: string;
  maskedNumber: string;
  isDefault: boolean;
  addedAt: number;
}

const STORAGE_KEY = "zakamall_saved_payments";

export function useSavedPaymentMethods() {
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const { isAuthenticated, user } = useAuth();

  // Load saved methods on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSavedMethods([]);
      return;
    }

    const userKey = `${STORAGE_KEY}_${user.id}`;
    const saved = localStorage.getItem(userKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedMethods(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Error parsing saved payment methods:", error);
        localStorage.removeItem(userKey);
        setSavedMethods([]);
      }
    }
  }, [isAuthenticated, user]);

  const savePaymentMethod = (
    type: "orange_money" | "moov_money",
    phoneNumber: string,
    setAsDefault: boolean = false
  ) => {
    if (!isAuthenticated || !user) return;

    const maskedNumber = phoneNumber.replace(/(.{4})(.*)(.{2})/, "$1****$3");
    const newMethod: SavedPaymentMethod = {
      id: `${type}_${Date.now()}`,
      type,
      phoneNumber,
      maskedNumber,
      isDefault: setAsDefault,
      addedAt: Date.now(),
    };

    setSavedMethods((prev) => {
      // Remove existing method with same phone number and type
      const filtered = prev.filter(
        (method) => !(method.type === type && method.phoneNumber === phoneNumber)
      );

      // If setting as default, remove default flag from others
      const updated = setAsDefault
        ? filtered.map((method) => ({ ...method, isDefault: false }))
        : filtered;

      const final = [newMethod, ...updated];

      // Save to localStorage
      const userKey = `${STORAGE_KEY}_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(final));

      return final;
    });
  };

  const removePaymentMethod = (methodId: string) => {
    if (!isAuthenticated || !user) return;

    setSavedMethods((prev) => {
      const filtered = prev.filter((method) => method.id !== methodId);

      // Save to localStorage
      const userKey = `${STORAGE_KEY}_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(filtered));

      return filtered;
    });
  };

  const setDefaultPaymentMethod = (methodId: string) => {
    if (!isAuthenticated || !user) return;

    setSavedMethods((prev) => {
      const updated = prev.map((method) => ({
        ...method,
        isDefault: method.id === methodId,
      }));

      // Save to localStorage
      const userKey = `${STORAGE_KEY}_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(updated));

      return updated;
    });
  };

  const getDefaultPaymentMethod = (): SavedPaymentMethod | null => {
    return savedMethods.find((method) => method.isDefault) || null;
  };

  const clearAllPaymentMethods = () => {
    if (!isAuthenticated || !user) return;

    setSavedMethods([]);
    const userKey = `${STORAGE_KEY}_${user.id}`;
    localStorage.removeItem(userKey);
  };

  return {
    savedMethods,
    savePaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    getDefaultPaymentMethod,
    clearAllPaymentMethods,
    hasPaymentMethods: savedMethods.length > 0,
  };
}
