import { useContext } from "react";
import { isTheme, Theme, ThemeContext } from "./theme-provider";

export { isTheme, Theme };

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
