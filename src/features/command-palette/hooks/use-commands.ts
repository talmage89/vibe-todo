import {
  CalendarDaysIcon,
  CalendarIcon,
  Cog6ToothIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useProjects } from "~/features/projects/hooks/use-projects";
import type { Command } from "../types";

export const useCommands = (onClose: () => void) => {
  const navigate = useNavigate();
  const { projects } = useProjects();

  return useMemo(() => {
    const commands: Command[] = [
      {
        id: "nav-inbox",
        type: "navigation",
        label: "Go to Inbox",
        icon: InboxIcon,
        keywords: ["inbox", "home"],
        onSelect: () => {
          navigate({ to: "/" });
          onClose();
        },
      },
      {
        id: "nav-today",
        type: "navigation",
        label: "Go to Today",
        icon: CalendarIcon,
        keywords: ["today", "due"],
        onSelect: () => {
          navigate({ to: "/today" });
          onClose();
        },
      },
      {
        id: "nav-upcoming",
        type: "navigation",
        label: "Go to Upcoming",
        icon: CalendarDaysIcon,
        keywords: ["upcoming", "schedule", "future"],
        onSelect: () => {
          navigate({ to: "/upcoming" });
          onClose();
        },
      },
      {
        id: "nav-settings",
        type: "navigation",
        label: "Go to Settings",
        icon: Cog6ToothIcon,
        keywords: ["settings", "preferences", "config"],
        onSelect: () => {
          navigate({ to: "/settings" });
          onClose();
        },
      },
      ...projects.map(
        (project): Command => ({
          id: `project-${project.id}`,
          type: "project",
          label: project.name,
          keywords: [project.name.toLowerCase()],
          onSelect: () => {
            navigate({ to: "/project/$projectId", params: { projectId: project.id } });
            onClose();
          },
        }),
      ),
    ];

    return commands;
  }, [navigate, onClose, projects]);
};
