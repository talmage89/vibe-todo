export const Tmp = () => {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 font-semibold text-[2rem] text-[var(--color-text-primary)]">
          Todo App - Design System Demo
        </h1>

        {/* Typography Section */}
        <section className="mb-8 rounded-lg bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-semibold text-[1.5rem] text-[var(--color-text-primary)]">
            Typography Scale
          </h2>
          <div className="space-y-2">
            <p className="text-[0.75rem] text-[var(--color-text-secondary)]">12px - Extra Small</p>
            <p className="text-[0.875rem] text-[var(--color-text-secondary)]">14px - Small</p>
            <p className="text-[var(--color-text-primary)] text-base">16px - Base</p>
            <p className="text-[var(--color-text-primary)] text-lg">18px - Large</p>
            <p className="text-[1.5rem] text-[var(--color-text-primary)]">24px - Extra Large</p>
            <p className="text-[2rem] text-[var(--color-text-primary)]">32px - 2X Large</p>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="mb-8 rounded-lg bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-semibold text-[1.5rem] text-[var(--color-text-primary)]">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <div className="mb-2 h-16 rounded border border-[var(--color-border)] bg-[var(--color-background)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Background</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-surface)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Surface</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-accent)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Accent</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-text-primary)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Text Primary</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-text-secondary)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Text Secondary</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-border)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Border</p>
            </div>
          </div>
        </section>

        {/* Priority Colors Section */}
        <section className="mb-8 rounded-lg bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-semibold text-[1.5rem] text-[var(--color-text-primary)]">
            Priority Colors
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-priority-urgent)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Urgent</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-priority-high)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">High</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-priority-medium)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Medium</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-[var(--color-priority-low)]" />
              <p className="text-[var(--color-text-secondary)] text-sm">Low</p>
            </div>
          </div>
        </section>

        <p className="text-[var(--color-text-secondary)] text-sm">
          Note: Theme automatically follows system preferences (light/dark mode). You can also
          manually add the "dark" class to test.
        </p>
      </div>
    </div>
  );
};
