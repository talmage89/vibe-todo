export const Tmp = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
      <div className="container mx-auto px-4 py-8">
        <h1
          className="mb-8 font-semibold text-4xl"
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--color-text-primary)",
          }}
        >
          Todo App - Design System Demo
        </h1>

        {/* Typography Section */}
        <section
          className="mb-8 p-6"
          style={{ backgroundColor: "var(--color-surface)", borderRadius: "8px" }}
        >
          <h2
            className="mb-4 font-semibold text-xl"
            style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text-primary)",
            }}
          >
            Typography Scale
          </h2>
          <div className="space-y-2">
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              12px - Extra Small
            </p>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              14px - Small
            </p>
            <p style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-primary)" }}>
              16px - Base
            </p>
            <p style={{ fontSize: "var(--font-size-lg)", color: "var(--color-text-primary)" }}>
              18px - Large
            </p>
            <p style={{ fontSize: "var(--font-size-xl)", color: "var(--color-text-primary)" }}>
              24px - Extra Large
            </p>
            <p style={{ fontSize: "var(--font-size-2xl)", color: "var(--color-text-primary)" }}>
              32px - 2X Large
            </p>
          </div>
        </section>

        {/* Color Palette Section */}
        <section
          className="mb-8 p-6"
          style={{ backgroundColor: "var(--color-surface)", borderRadius: "8px" }}
        >
          <h2
            className="mb-4 font-semibold text-xl"
            style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text-primary)",
            }}
          >
            Color Palette
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{
                  backgroundColor: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Background
              </p>
            </div>
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-surface)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Surface
              </p>
            </div>
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-accent)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Accent
              </p>
            </div>
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-text-primary)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Text Primary
              </p>
            </div>
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-text-secondary)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Text Secondary
              </p>
            </div>
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-border)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Border
              </p>
            </div>
          </div>
        </section>

        {/* Priority Colors Section */}
        <section
          className="mb-8 p-6"
          style={{ backgroundColor: "var(--color-surface)", borderRadius: "8px" }}
        >
          <h2
            className="mb-4 font-semibold text-xl"
            style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text-primary)",
            }}
          >
            Priority Colors
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-priority-urgent)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Urgent
              </p>
            </div>
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-priority-high)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                High
              </p>
            </div>
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-priority-medium)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Medium
              </p>
            </div>
            <div>
              <div
                className="mb-2 h-16 rounded"
                style={{ backgroundColor: "var(--color-priority-low)" }}
              ></div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                Low
              </p>
            </div>
          </div>
        </section>

        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          Note: Theme automatically follows system preferences (light/dark mode). You can also
          manually add the "dark" class to test.
        </p>
      </div>
    </div>
  );
};
