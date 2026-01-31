export const Tmp = () => {
  return (
    <div className="min-h-screen bg-background font-sans text-primary">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 font-semibold text-2xl">Todo App - Design System Demo</h1>

        {/* Typography Section */}
        <section className="mb-8 rounded-lg bg-surface p-6">
          <h2 className="mb-4 font-semibold text-xl">Typography Scale</h2>
          <div className="space-y-2">
            <p className="text-secondary text-xs">12px - Extra Small</p>
            <p className="text-secondary text-sm">14px - Small</p>
            <p className="text-base text-primary">16px - Base</p>
            <p className="text-lg text-primary">18px - Large</p>
            <p className="text-primary text-xl">24px - Extra Large</p>
            <p className="text-2xl text-primary">32px - 2X Large</p>
          </div>
        </section>

        {/* Color Palette Section */}
        <section className="mb-8 rounded-lg bg-surface p-6">
          <h2 className="mb-4 font-semibold text-xl">Color Palette</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <div className="mb-2 h-16 rounded border border-border bg-background" />
              <p className="text-secondary text-sm">Background</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-surface" />
              <p className="text-secondary text-sm">Surface</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-accent" />
              <p className="text-secondary text-sm">Accent</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-primary" />
              <p className="text-secondary text-sm">Text Primary</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-secondary" />
              <p className="text-secondary text-sm">Text Secondary</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-border" />
              <p className="text-secondary text-sm">Border</p>
            </div>
          </div>
        </section>

        {/* Priority Colors Section */}
        <section className="mb-8 rounded-lg bg-surface p-6">
          <h2 className="mb-4 font-semibold text-xl">Priority Colors</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="mb-2 h-16 rounded bg-urgent" />
              <p className="text-secondary text-sm">Urgent</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-high" />
              <p className="text-secondary text-sm">High</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-medium" />
              <p className="text-secondary text-sm">Medium</p>
            </div>
            <div>
              <div className="mb-2 h-16 rounded bg-low" />
              <p className="text-secondary text-sm">Low</p>
            </div>
          </div>
        </section>

        <p className="text-secondary text-sm">
          Note: Theme automatically follows system preferences (light/dark mode). You can also
          manually add the "dark" class to test.
        </p>
      </div>
    </div>
  );
};
