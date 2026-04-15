import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterField, FiltersState } from "./filter-schema";
import { FilterModal } from "./filter-modal";
import { useUrlFilters } from "./use-url-filters";
import { parseDateForFilter } from "./filter-schema";

type FilterButtonProps = {
  title: string;
  schema: FilterField[];
  defaults?: FiltersState;
  className?: string;
  trigger?: (args: {
    onClick: () => void;
    activeCount: number;
    activeLabel: string | null;
  }) => React.ReactNode;
};

function getActiveCount(schema: FilterField[], filters: FiltersState) {
  let count = 0;
  for (const field of schema) {
    if (field.type === "dateRange") {
      const from = filters[field.fromKey];
      const to = filters[field.toKey];
      if (from || to) count += 1;
      continue;
    }

    if (field.type === "numberRange") {
      const min = filters[field.minKey];
      const max = filters[field.maxKey];
      if (typeof min === "number" || typeof max === "number") count += 1;
      continue;
    }

    const value = filters[field.key];
    if (Array.isArray(value)) {
      if (value.length) count += 1;
      continue;
    }

    if (typeof value === "string" && value.trim().length) {
      count += 1;
    }
  }
  return count;
}

function formatDateLabel(value: string) {
  const parsed = parseDateForFilter(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getActiveLabel(schema: FilterField[], filters: FiltersState) {
  const dateField = schema.find((field) => field.type === "dateRange");
  if (!dateField || dateField.type !== "dateRange") return null;
  const from = filters[dateField.fromKey];
  const to = filters[dateField.toKey];
  if (!from && !to) return null;
  const fromLabel = from ? formatDateLabel(String(from)) : "Start";
  const toLabel = to ? formatDateLabel(String(to)) : "End";
  return `${fromLabel} → ${toLabel}`;
}

export function FilterButton({
  title,
  schema,
  defaults,
  className,
  trigger,
}: FilterButtonProps) {
  const [open, setOpen] = useState(false);
  const { filters, setMany, reset } = useUrlFilters({ schema, defaults });

  const activeCount = useMemo(() => getActiveCount(schema, filters), [filters, schema]);
  const activeLabel = useMemo(() => getActiveLabel(schema, filters), [filters, schema]);

  const content =
    trigger?.({
      onClick: () => setOpen(true),
      activeCount,
      activeLabel,
    }) ??
    (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#D0D5DD] bg-white text-[#667085] transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#071B58]/15",
          className,
        )}
        aria-label="Open filters"
      >
        <Filter className="h-4 w-4" />
        {activeCount ? (
          <span className="sr-only">{`${activeCount} filters active`}</span>
        ) : null}
      </button>
    );

  return (
    <>
      {content}
      <FilterModal
        open={open}
        onOpenChange={setOpen}
        title={title}
        schema={schema}
        value={filters}
        onApply={(next) => setMany(next)}
        onReset={() => reset()}
      />
    </>
  );
}

