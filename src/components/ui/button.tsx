import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "quiet" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  staticPress?: boolean;
};

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-fg disabled:opacity-40",
  ghost:
    "bg-chip text-fg hover:bg-chip-active disabled:opacity-40",
  quiet:
    "bg-transparent text-muted hover:text-fg hover:bg-chip disabled:opacity-40",
  danger:
    "bg-transparent text-danger hover:bg-chip disabled:opacity-40",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", staticPress, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium",
        "transition-[transform,background-color,color,opacity] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        !staticPress && "active:not-disabled:scale-[0.96]",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
});
