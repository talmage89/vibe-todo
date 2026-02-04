import { useContext } from "react";
import { type Theme, ThemeContext } from "./theme-provider";

export type { Theme };

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
