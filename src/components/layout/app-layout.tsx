import { type ReactNode, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

interface Project {
  id: string;
  name: string;
  color: string | null;
  taskCount?: number;
}

interface AppLayoutProps {
  children: ReactNode;
  projects?: Project[];
  onAddTask?: () => void;
  onAddProject?: () => void;
}

/**
 * Main application layout with sidebar navigation, header, and content area.
 * Responsive design: sidebar collapses to a drawer on mobile.
 */
export const AppLayout = ({ children, projects, onAddTask, onAddProject }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={projects}
        onAddTask={onAddTask}
        onAddProject={onAddProject}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
