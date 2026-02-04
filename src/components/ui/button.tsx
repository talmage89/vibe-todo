import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded font-medium text-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "text-primary hover:bg-surface",
        secondary: "text-secondary hover:text-primary hover:bg-surface",
        destructive: "text-urgent hover:bg-urgent/10",
        filled: "bg-accent text-white hover:bg-accent/90",
        outline: "border border-border bg-background text-primary hover:bg-surface",
      },
      size: {
        sm: "h-8 px-2.5 py-1",
        md: "h-9 px-3 py-1.5",
        lg: "h-10 px-4 py-2",
        icon: "h-8 w-8 p-1.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
