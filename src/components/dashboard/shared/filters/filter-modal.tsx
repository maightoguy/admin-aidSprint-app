import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterField, FiltersState } from "./filter-schema";
import { parseDateForFilter, toIsoDateString } from "./filter-schema";

type FilterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  schema: FilterField[];
  value: FiltersState;
  onApply: (value: FiltersState) => void;
  onReset: () => void;
};

function formatDateLabel(value: string) {
  const parsed = parseDateForFilter(value);
  if (!parsed) return value;
  return format(parsed, "MMM d, yyyy");
}

function buildDateRangeValue(from: string | null | undefined, to: string | null | undefined) {
  const fromDate = from ? parseDateForFilter(from) : null;
  const toDate = to ? parseDateForFilter(to) : null;
  if (!fromDate && !toDate) return undefined;
  return {
    from: fromDate ?? undefined,
    to: toDate ?? undefined,
  } satisfies DateRange;
}

export function FilterModal({
  open,
  onOpenChange,
  title,
  schema,
  value,
  onApply,
  onReset,
}: FilterModalProps) {
  const [draft, setDraft] = useState<FiltersState>(value);

  const dateRangeField = useMemo(
    () => schema.find((field) => field.type === "dateRange") ?? null,
    [schema],
  );

  const dateRange = useMemo(() => {
    if (!dateRangeField || dateRangeField.type !== "dateRange") return undefined;
    return buildDateRangeValue(
      String(draft[dateRangeField.fromKey] ?? ""),
      String(draft[dateRangeField.toKey] ?? ""),
    );
  }, [dateRangeField, draft]);

  const hasDateRange = useMemo(() => {
    if (!dateRangeField || dateRangeField.type !== "dateRange") return false;
    const from = draft[dateRangeField.fromKey];
    const to = draft[dateRangeField.toKey];
    return Boolean(from) || Boolean(to);
  }, [dateRangeField, draft]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setDraft(value);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-[560px] rounded-[20px] border border-[#EAECF0] bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
        <DialogHeader className="border-b border-[#EAECF0] px-6 py-5 text-left">
          <DialogTitle className="text-base font-semibold text-[#101828]">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          {schema.map((field) => {
            if (field.type === "dateRange") {
              const fromLabel = draft[field.fromKey]
                ? formatDateLabel(String(draft[field.fromKey]))
                : "Start date";
              const toLabel = draft[field.toKey]
                ? formatDateLabel(String(draft[field.toKey]))
                : "End date";

              return (
                <section key={`${field.fromKey}-${field.toKey}`} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#101828]">
                      {field.label}
                    </p>
                    <p
                      className={cn(
                        "text-xs font-medium",
                        hasDateRange ? "text-[#041133]" : "text-[#98A2B3]",
                      )}
                      aria-live="polite"
                    >
                      {hasDateRange ? `${fromLabel} → ${toLabel}` : "All time"}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-[#EAECF0] bg-[#FCFCFD] p-3">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(nextRange) => {
                        const from = nextRange?.from ? toIsoDateString(nextRange.from) : null;
                        const to = nextRange?.to ? toIsoDateString(nextRange.to) : null;
                        setDraft((prev) => ({
                          ...prev,
                          [field.fromKey]: from,
                          [field.toKey]: to,
                        }));
                      }}
                      numberOfMonths={2}
                      className="p-0"
                    />
                  </div>
                </section>
              );
            }

            if (field.type === "select") {
              return (
                <label key={field.key} className="space-y-2">
                  <span className="text-sm font-semibold text-[#101828]">
                    {field.label}
                  </span>
                  <Select
                    value={String(draft[field.key] ?? "")}
                    onValueChange={(nextValue) =>
                      setDraft((prev) => ({
                        ...prev,
                        [field.key]: nextValue === "all" ? null : nextValue,
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-[12px] border-[#EAECF0] bg-[#FCFCFD] text-sm text-[#101828]">
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-[12px] border-[#EAECF0]">
                      <SelectItem value="all">All</SelectItem>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              );
            }

            if (field.type === "multiSelect") {
              const selected = Array.isArray(draft[field.key])
                ? (draft[field.key] as string[])
                : [];
              return (
                <section key={field.key} className="space-y-2">
                  <p className="text-sm font-semibold text-[#101828]">
                    {field.label}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {field.options.map((option) => {
                      const checked = selected.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-2 rounded-[12px] border border-[#EAECF0] bg-[#FCFCFD] px-3 py-2 text-sm text-[#101828]"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => {
                              setDraft((prev) => {
                                const existing = Array.isArray(prev[field.key])
                                  ? (prev[field.key] as string[])
                                  : [];
                                const next = checked
                                  ? existing.filter((value) => value !== option.value)
                                  : [...existing, option.value];
                                return {
                                  ...prev,
                                  [field.key]: next.length ? next : null,
                                };
                              });
                            }}
                            aria-label={`${field.label} ${option.label}`}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            }

            if (field.type === "numberRange") {
              const minValue = draft[field.minKey];
              const maxValue = draft[field.maxKey];
              return (
                <section key={`${field.minKey}-${field.maxKey}`} className="space-y-2">
                  <p className="text-sm font-semibold text-[#101828]">
                    {field.label}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-[#667085]">
                        {field.minLabel ?? "Min"}
                      </span>
                      <Input
                        type="number"
                        value={typeof minValue === "number" ? String(minValue) : ""}
                        onChange={(event) => {
                          const raw = event.target.value.trim();
                          setDraft((prev) => ({
                            ...prev,
                            [field.minKey]: raw ? Number(raw) : null,
                          }));
                        }}
                        className="h-11 rounded-[12px] border-[#EAECF0] bg-[#FCFCFD]"
                        aria-label={`${field.label} ${field.minLabel ?? "min"}`}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-[#667085]">
                        {field.maxLabel ?? "Max"}
                      </span>
                      <Input
                        type="number"
                        value={typeof maxValue === "number" ? String(maxValue) : ""}
                        onChange={(event) => {
                          const raw = event.target.value.trim();
                          setDraft((prev) => ({
                            ...prev,
                            [field.maxKey]: raw ? Number(raw) : null,
                          }));
                        }}
                        className="h-11 rounded-[12px] border-[#EAECF0] bg-[#FCFCFD]"
                        aria-label={`${field.label} ${field.maxLabel ?? "max"}`}
                      />
                    </label>
                  </div>
                </section>
              );
            }

            return null;
          })}
        </div>
        <div className="flex flex-col gap-3 border-t border-[#EAECF0] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-[12px] border-[#EAECF0] text-[#667085]"
            onClick={() => {
              setDraft(value);
              onReset();
              onOpenChange(false);
            }}
          >
            Reset
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-[12px] border-[#EAECF0] text-[#667085]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 rounded-[12px] bg-[#041133] text-white hover:bg-[#0A1C4E]"
              onClick={() => {
                onApply(draft);
                onOpenChange(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

