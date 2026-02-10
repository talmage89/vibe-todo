import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { type ReactNode, useCallback, useState } from "react";
import { toSectionSortId } from "~/features/tasks/hooks/use-task-drag-drop";
import type { Section } from "../types";
import { SectionCreateForm } from "./section-create-form";
import { SectionItem } from "./section-item";

interface SectionListProps {
  sections: Section[];
  onCreateSection: (name: string) => Promise<unknown>;
  onUpdateSection: (sectionId: string, name: string) => Promise<unknown>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  taskCountBySectionId?: Record<string, number>;
  renderSectionContent?: (sectionId: string, isCollapsed: boolean) => ReactNode;
}

export function SectionList({
  sections,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  taskCountBySectionId = {},
  renderSectionContent,
}: SectionListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleCreateSection = useCallback(
    async (name: string) => {
      await onCreateSection(name);
    },
    [onCreateSection],
  );

  return (
    <div className="space-y-1">
      <SortableContext
        items={sections.map((s) => toSectionSortId(s.id))}
        strategy={verticalListSortingStrategy}
      >
        {sections.map((section) => (
          <SectionItem
            key={section.id}
            section={section}
            sortableId={toSectionSortId(section.id)}
            isCollapsed={collapsedSections.has(section.id)}
            onToggleCollapse={() => toggleCollapse(section.id)}
            onUpdate={(name) => onUpdateSection(section.id, name)}
            onDelete={() => onDeleteSection(section.id)}
            taskCount={taskCountBySectionId[section.id]}
          >
            {renderSectionContent?.(section.id, collapsedSections.has(section.id))}
          </SectionItem>
        ))}
      </SortableContext>

      <SectionCreateForm onSubmit={handleCreateSection} />
    </div>
  );
}

export type { SectionListProps };
