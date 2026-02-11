import type { ComponentType, SVGProps } from "react";

export type CommandType = "navigation" | "action" | "task" | "project";

export interface Command {
  id: string;
  type: CommandType;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  onSelect: () => void;
  keywords?: string[];
}
