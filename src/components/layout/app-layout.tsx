import { type ReactNode, useState } from "react";
import { CommandPalette } from "~/features/command-palette/components/command-palette";
import { useCommandPalette } from "~/features/command-palette/hooks/use-command-palette";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: ReactNode;
  onAddTask?: () => void;
}

export const AppLayout = ({ children, onAddTask }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { open: paletteOpen, setOpen: setPaletteOpen, close: closePalette } = useCommandPalette();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onAddTask={onAddTask} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setPaletteOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onClose={closePalette} />
    </div>
  );
};
