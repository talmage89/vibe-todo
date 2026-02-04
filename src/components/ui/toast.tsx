import { XMarkIcon } from "@heroicons/react/24/outline";
import { cva, type VariantProps } from "class-variance-authority";
import {
  createContext,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { cn } from "./cn";

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded border p-4 shadow-sm transition-all",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-primary",
        success: "border-low/30 bg-low/10 text-primary",
        error: "border-urgent/30 bg-urgent/10 text-primary",
        warning: "border-medium/30 bg-medium/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ToastProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  onClose?: () => void;
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, children, onClose, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(toastVariants({ variant }), className)} {...props}>
        <div className="flex-1 text-sm">{children}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-secondary transition-colors hover:bg-surface hover:text-primary"
          >
            <XMarkIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    );
  },
);
Toast.displayName = "Toast";

const ToastTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("font-medium text-sm", className)} {...props} />
  ),
);
ToastTitle.displayName = "ToastTitle";

const ToastDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-secondary text-sm", className)} {...props} />
  ),
);
ToastDescription.displayName = "ToastDescription";

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: VariantProps<typeof toastVariants>["variant"];
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed right-0 bottom-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  return (
    <Toast variant={toast.variant} onClose={onClose}>
      {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
      {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
    </Toast>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const toast = useCallback(
    (props: Omit<ToastData, "id">) => {
      context.addToast(props);
    },
    [context],
  );

  return { toast, toasts: context.toasts };
}

export { Toast, ToastDescription, ToastProvider, ToastTitle, useToast };
