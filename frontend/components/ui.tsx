import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60";
  const sizes = { sm: "px-4 py-2 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-sm" };
  const variants = {
    primary: "bg-crimson-500 text-paper hover:opacity-90 shadow-soft",
    secondary: "bg-pine-500 text-paper hover:opacity-90 shadow-soft",
    ghost: "border border-slate-200 text-ink hover:border-crimson-400 hover:text-crimson-500",
    danger: "bg-red-600 text-white hover:opacity-90",
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
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400",
          "focus:border-crimson-400 focus:outline-none focus:ring-2 focus:ring-crimson-100",
          error && "border-red-400 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400",
          "focus:border-crimson-400 focus:outline-none focus:ring-2 focus:ring-crimson-100",
          error && "border-red-400 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

export function Select({ label, error, className, id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink",
          "focus:border-crimson-400 focus:outline-none focus:ring-2 focus:ring-crimson-100",
          error && "border-red-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-2xl border border-slate-100 bg-white p-6 shadow-soft", className)}>{children}</div>;
}

export function Alert({ variant = "info", children }: { variant?: "info" | "error" | "success" | "warning"; children: React.ReactNode }) {
  const styles = {
    info: "bg-slate-50 text-slate-700 border-slate-200",
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-pine-50 text-pine-600 border-pine-100",
    warning: "bg-gold-100 text-gold-500 border-gold-100",
  };
  return <div className={clsx("rounded-xl border px-4 py-3 text-sm", styles[variant])}>{children}</div>;
}
