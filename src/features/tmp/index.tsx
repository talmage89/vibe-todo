import {
  CalendarIcon,
  Cog6ToothIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export const Tmp = () => {
  return (
    <div className="min-h-screen bg-background font-sans text-primary">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 font-semibold text-lg">Todo App - Design System Demo</h1>

        {/* Typography Section */}
        <section className="mb-6 rounded border border-border bg-surface p-4">
          <h2 className="mb-4 font-medium text-sm">Typography Scale</h2>
          <div className="space-y-2">
            <p className="text-secondary text-xs">12px - Extra Small (xs)</p>
            <p className="text-secondary text-sm">14px - Small (sm)</p>
            <p className="text-base text-primary">16px - Base</p>
            <p className="text-lg text-primary">18px - Large (lg)</p>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-6 rounded border border-border bg-surface p-4">
          <h2 className="mb-4 font-medium text-sm">Buttons</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="filled">Filled CTA</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary" size="icon" aria-label="Add">
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="mb-6 rounded border border-border bg-surface p-4">
          <h2 className="mb-4 font-medium text-sm">Inputs</h2>
          <div className="max-w-sm space-y-3">
            <Input placeholder="Default input" />
            <Input placeholder="Disabled input" disabled />
          </div>
        </section>

        {/* Icons Section */}
        <section className="mb-6 rounded border border-border bg-surface p-4">
          <h2 className="mb-4 font-medium text-sm">Icons (Heroicons)</h2>
          <p className="mb-3 text-secondary text-xs">
            Using outline variant, 1.5px stroke, 20px for navigation, 16px inline
          </p>
          <div className="flex items-center gap-4">
            <InboxIcon className="h-5 w-5 text-secondary" />
            <CalendarIcon className="h-5 w-5 text-secondary" />
            <Cog6ToothIcon className="h-5 w-5 text-secondary" />
            <MagnifyingGlassIcon className="h-4 w-4 text-secondary" />
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="mb-6 rounded border border-border bg-surface p-4">
          <h2 className="mb-4 font-medium text-sm">Color Palette</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="mb-2 h-12 rounded border border-border bg-background" />
              <p className="text-secondary text-xs">Background</p>
            </div>
            <div>
              <div className="mb-2 h-12 rounded bg-surface" />
              <p className="text-secondary text-xs">Surface</p>
            </div>
            <div>
              <div className="mb-2 h-12 rounded bg-accent" />
              <p className="text-secondary text-xs">Accent</p>
            </div>
            <div>
              <div className="mb-2 h-12 rounded bg-primary" />
              <p className="text-secondary text-xs">Text Primary</p>
            </div>
            <div>
              <div className="mb-2 h-12 rounded bg-secondary" />
              <p className="text-secondary text-xs">Text Secondary</p>
            </div>
            <div>
              <div className="mb-2 h-12 rounded bg-border" />
              <p className="text-secondary text-xs">Border</p>
            </div>
          </div>
        </section>

        {/* Priority Colors Section */}
        <section className="mb-6 rounded border border-border bg-surface p-4">
          <h2 className="mb-4 font-medium text-sm">Priority Colors</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="mb-2 h-12 rounded bg-urgent" />
              <p className="text-secondary text-xs">Urgent</p>
            </div>
            <div>
              <div className="mb-2 h-12 rounded bg-high" />
              <p className="text-secondary text-xs">High</p>
            </div>
            <div>
              <div className="mb-2 h-12 rounded bg-medium" />
              <p className="text-secondary text-xs">Medium</p>
            </div>
            <div>
              <div className="mb-2 h-12 rounded bg-low" />
              <p className="text-secondary text-xs">Low</p>
            </div>
          </div>
        </section>

        <p className="text-secondary text-xs">
          Theme automatically follows system preferences (light/dark mode).
        </p>
      </div>
    </div>
  );
};
