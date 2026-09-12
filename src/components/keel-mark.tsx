import { cn } from "@/lib/utils";

export function KeelMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-fg", className)}
      aria-hidden="true"
    >
      <path
        d="M16 3 L26 27 H21.4 L16 14.2 L10.6 27 H6 Z"
        fill="currentColor"
      />
    </svg>
  );
}
