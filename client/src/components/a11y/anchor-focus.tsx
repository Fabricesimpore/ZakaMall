"use client";
import { useEffect } from "react";

export function AnchorFocus() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash) as HTMLElement | null;
      if (el) {
        el.setAttribute("tabindex", "-1");
        el.focus();
      }
    }
  }, []);
  
  return null;
}