import { useContext } from "react";
import { isTheme, type Theme, ThemeContext } from "./theme-provider";

export { isTheme };
export type { Theme };

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
