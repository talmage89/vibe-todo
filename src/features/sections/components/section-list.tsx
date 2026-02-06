import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { type ReactNode, useCallback, useState } from "react";
import type { Section } from "~/types/models";
import { SectionCreateForm } from "./section-create-form";
import { SectionItem } from "./section-item";

interface SectionListProps {
  sections: Section[];
  onCreateSection: (name: string) => Promise<unknown>;
  onUpdateSection: (sectionId: string, name: string) => Promise<unknown>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onReorderSections: (sectionIds: string[]) => Promise<void>;
  taskCountBySectionId?: Record<string, number>;
  renderSectionContent?: (sectionId: string, isCollapsed: boolean) => ReactNode;
}

export function SectionList({
  sections,
  onCreateSection,
  onUpdateSection,
  onDeleteSection,
  onReorderSections,
  taskCountBySectionId = {},
  renderSectionContent,
}: SectionListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = [...sections];
        const removed = newOrder.splice(oldIndex, 1)[0];
        if (!removed) return;
        newOrder.splice(newIndex, 0, removed);

        await onReorderSections(newOrder.map((s) => s.id));
      }
    },
    [sections, onReorderSections],
  );

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
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
      </DndContext>

      <SectionCreateForm onSubmit={handleCreateSection} />
    </div>
  );
}

export type { SectionListProps };
