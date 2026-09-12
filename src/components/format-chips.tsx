import { FILTERS } from "@/lib/catalog";
import type { FilterId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FormatChips({
  value,
  onChange,
}: {
  value: FilterId;
  onChange: (id: FilterId) => void;
}) {
  return (
    <div className="rounded-2xl bg-elevated p-1.5 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const on = f.id === value;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              className={cn(
                "min-h-10 rounded-xl px-3.5 text-sm transition-colors duration-150",
                on ? "bg-chip-active text-fg" : "text-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
