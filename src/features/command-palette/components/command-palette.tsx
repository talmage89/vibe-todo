import { HashtagIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "~/components/ui/cn";
import { useCommands } from "../hooks/use-commands";
import type { Command, CommandType } from "../types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeLabels: Record<CommandType, string> = {
  navigation: "Navigation",
  action: "Actions",
  task: "Tasks",
  project: "Projects",
};

const typeOrder: CommandType[] = ["navigation", "project", "action", "task"];

function filterCommands(commands: Command[], query: string): Command[] {
  if (!query) return commands;
  const lower = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(lower) || cmd.keywords?.some((kw) => kw.includes(lower)),
  );
}

function groupCommands(commands: Command[]): [CommandType, Command[]][] {
  const grouped = new Map<CommandType, Command[]>();
  for (const cmd of commands) {
    const group = grouped.get(cmd.type) ?? [];
    group.push(cmd);
    grouped.set(cmd.type, group);
  }
  return typeOrder
    .filter((t) => grouped.has(t))
    .map((t) => [t, grouped.get(t) as Command[]] as [CommandType, Command[]]);
}

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const commands = useCommands(close);
  const filtered = useMemo(() => filterCommands(commands, query), [commands, query]);
  const grouped = useMemo(() => groupCommands(filtered), [filtered]);

  const flatItems = useMemo(() => grouped.flatMap(([, cmds]) => cmds), [grouped]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const scrollActiveIntoView = useCallback((index: number) => {
    const el = listRef.current?.querySelector(`[data-index="${index}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = activeIndex < flatItems.length - 1 ? activeIndex + 1 : 0;
          setActiveIndex(next);
          scrollActiveIntoView(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = activeIndex > 0 ? activeIndex - 1 : flatItems.length - 1;
          setActiveIndex(prev);
          scrollActiveIntoView(prev);
          break;
        }
        case "Enter": {
          e.preventDefault();
          flatItems[activeIndex]?.onSelect();
          break;
        }
      }
    },
    [activeIndex, flatItems, scrollActiveIntoView],
  );

  let itemIndex = 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-primary/20",
            "data-[state=closed]:animate-out data-[state=open]:animate-in",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2",
            "rounded-md border border-border bg-background shadow-md",
            "data-[state=closed]:animate-out data-[state=open]:animate-in",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-150",
          )}
          onKeyDown={handleKeyDown}
          aria-label="Command palette"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-border border-b px-3">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-secondary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search commands..."
              className="h-10 w-full bg-transparent text-primary text-sm placeholder:text-secondary focus:outline-none"
              autoFocus
            />
            <kbd className="shrink-0 rounded bg-surface px-1.5 py-0.5 font-medium text-secondary text-xs">
              Esc
            </kbd>
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5" role="listbox">
            {flatItems.length === 0 ? (
              <div className="px-3 py-6 text-center text-secondary text-sm">No results found</div>
            ) : (
              grouped.map(([type, cmds]) => (
                <div key={type} role="group" aria-label={typeLabels[type]}>
                  <div className="px-2 py-1.5 font-medium text-secondary text-xs">
                    {typeLabels[type]}
                  </div>
                  {cmds.map((cmd) => {
                    const currentIndex = itemIndex++;
                    const isActive = currentIndex === activeIndex;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        type="button"
                        role="option"
                        data-index={currentIndex}
                        aria-selected={isActive}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors",
                          isActive
                            ? "bg-surface text-primary"
                            : "text-secondary hover:bg-surface hover:text-primary",
                        )}
                        onClick={() => cmd.onSelect()}
                        onMouseEnter={() => setActiveIndex(currentIndex)}
                      >
                        {Icon ? (
                          <Icon className="h-4 w-4 shrink-0" />
                        ) : cmd.type === "project" ? (
                          <HashtagIcon className="h-4 w-4 shrink-0" />
                        ) : null}
                        <span className="truncate">{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 border-border border-t px-3 py-2 text-secondary text-xs">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-surface px-1 py-0.5 font-medium">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-surface px-1 py-0.5 font-medium">↵</kbd> select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-surface px-1 py-0.5 font-medium">esc</kbd> close
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
