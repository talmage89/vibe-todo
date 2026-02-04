import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./cn";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 font-medium text-xs transition-colors",
  {
    variants: {
      variant: {
        default: "border border-border bg-surface text-primary",
        secondary: "border border-border bg-background text-secondary",
        accent: "bg-accent/10 text-accent",
        urgent: "bg-urgent/10 text-urgent",
        high: "bg-high/10 text-high",
        medium: "bg-medium/10 text-medium",
        low: "bg-low/10 text-low",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
