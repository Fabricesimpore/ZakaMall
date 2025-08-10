import { ReactNode } from "react";
import { DarkModeContext, useDarkModeState } from "@/hooks/useDarkMode";

interface DarkModeProviderProps {
  children: ReactNode;
}

export default function DarkModeProvider({ children }: DarkModeProviderProps) {
  const darkModeState = useDarkModeState();

  return <DarkModeContext.Provider value={darkModeState}>{children}</DarkModeContext.Provider>;
}
