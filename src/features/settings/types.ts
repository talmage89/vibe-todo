export type SettingsSection = "profile" | "preferences" | "shortcuts" | "data" | "accounts";

export interface SettingsSearch {
  section?: SettingsSection;
}

const SETTINGS_SECTIONS = ["profile", "preferences", "shortcuts", "data", "accounts"] as const;

export function isSettingsSection(value: unknown): value is SettingsSection {
  return typeof value === "string" && SETTINGS_SECTIONS.includes(value as SettingsSection);
}
