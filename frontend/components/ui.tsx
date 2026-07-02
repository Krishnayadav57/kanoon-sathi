import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-smooth " +
    "disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-offset-2";
  const sizes = { sm: "px-4 py-2 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-[15px]" };
  const variants = {
    primary: "bg-ink text-paper shadow-soft hover:bg-crimson-600 hover:shadow-lifted focus-visible:ring-crimson-200",
    secondary: "bg-emerald-500 text-paper shadow-soft hover:bg-emerald-600 hover:shadow-lifted focus-visible:ring-emerald-100",
    ghost: "border border-slate-200 text-ink hover:border-ink hover:bg-slate-50 focus-visible:ring-slate-200",
    danger: "bg-crimson-500 text-paper shadow-soft hover:bg-crimson-600 focus-visible:ring-crimson-200",
  };
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400",
          "transition-all duration-200 ease-smooth",
          "focus:border-ink focus:outline-none focus:ring-2 focus:ring-crimson-100",
          error && "border-crimson-400 focus:ring-crimson-100",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-crimson-500">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400",
          "transition-all duration-200 ease-smooth",
          "focus:border-ink focus:outline-none focus:ring-2 focus:ring-crimson-100",
          error && "border-crimson-400 focus:ring-crimson-100",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-crimson-500">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

export function Select({ label, error, className, id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink",
          "transition-all duration-200 ease-smooth",
          "focus:border-ink focus:outline-none focus:ring-2 focus:ring-crimson-100",
          error && "border-crimson-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-crimson-500">{error}</p>}
    </div>
  );
}

export function Card({
  className,
  children,
  interactive = false,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={clsx(
        "rounded-2xl border border-slate-100 bg-white p-6 shadow-soft transition-all duration-300 ease-smooth",
        interactive && "scan-trace-border cursor-pointer hover:-translate-y-1 hover:shadow-lifted hover:border-slate-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Alert({ variant = "info", children }: { variant?: "info" | "error" | "success" | "warning"; children: React.ReactNode }) {
  const styles = {
    info: "bg-slate-50 text-slate-600 border-slate-200",
    error: "bg-crimson-50 text-crimson-600 border-crimson-100",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-brass-50 text-brass-500 border-brass-100",
  };
  return <div className={clsx("animate-fade-in rounded-xl border px-4 py-3 text-sm", styles[variant])}>{children}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse-soft rounded-lg bg-slate-100", className)} />;
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "crimson" | "emerald" | "brass";
  className?: string;
}) {
  const styles = {
    default: "bg-slate-50 text-slate-600",
    crimson: "bg-crimson-50 text-crimson-500",
    emerald: "bg-emerald-50 text-emerald-500",
    brass: "bg-brass-50 text-brass-500",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", styles[variant], className)}>
      {children}
    </span>
  );
}
