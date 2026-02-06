import { useSearch } from "@tanstack/react-router";
import { isSettingsSection, type SettingsSection } from "../types";
import { ConnectedAccountsSection } from "./connected-accounts-section";
import { DataSection } from "./data-section";
import { PreferencesSection } from "./preferences-section";
import { ProfileSection } from "./profile-section";
import { SettingsNav } from "./settings-nav";
import { ShortcutsSection } from "./shortcuts-section";

function getSection(search: { section?: unknown }): SettingsSection {
  if (isSettingsSection(search.section)) {
    return search.section;
  }
  return "profile";
}

function renderSection(section: SettingsSection) {
  switch (section) {
    case "profile":
      return <ProfileSection />;
    case "preferences":
      return <PreferencesSection />;
    case "shortcuts":
      return <ShortcutsSection />;
    case "data":
      return <DataSection />;
    case "accounts":
      return <ConnectedAccountsSection />;
  }
}

export function Settings() {
  const search = useSearch({ from: "/settings" });
  const currentSection = getSection(search);

  return (
    <div className="flex h-full">
      <SettingsNav currentSection={currentSection} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">{renderSection(currentSection)}</div>
      </main>
    </div>
  );
}
