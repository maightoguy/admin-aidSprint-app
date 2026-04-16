import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type ViewportMode = "mobile" | "tablet" | "desktop";

const MOBILE_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

function formatDateLabel(value: string) {
  const parsed = parseDateForFilter(value);
  if (!parsed) return value;
  return format(parsed, "MMM d, yyyy");
}

function buildDateRangeValue(
  from: string | null | undefined,
  to: string | null | undefined,
) {
  const fromDate = from ? parseDateForFilter(from) : null;
  const toDate = to ? parseDateForFilter(to) : null;
  if (!fromDate && !toDate) return undefined;
  return {
    from: fromDate ?? undefined,
    to: toDate ?? undefined,
  } satisfies DateRange;
}

function getViewportMode(width: number): ViewportMode {
  if (width < MOBILE_BREAKPOINT) return "mobile";
  if (width < DESKTOP_BREAKPOINT) return "tablet";
  return "desktop";
}

function getFieldId(field: FilterField) {
  if (field.type === "dateRange") {
    return `${field.fromKey}-${field.toKey}`;
  }

  if (field.type === "numberRange") {
    return `${field.minKey}-${field.maxKey}`;
  }

  return field.key;
}

function getFieldSummary(field: FilterField, draft: FiltersState) {
  if (field.type === "dateRange") {
    const from = draft[field.fromKey];
    const to = draft[field.toKey];
    if (!from && !to) return "All time";

    const fromLabel = from ? formatDateLabel(String(from)) : "Start date";
    const toLabel = to ? formatDateLabel(String(to)) : "End date";
    return `${fromLabel} -> ${toLabel}`;
  }

  if (field.type === "select") {
    const selectedValue = draft[field.key];
    if (!selectedValue) return "All";

    return (
      field.options.find((option) => option.value === selectedValue)?.label ??
      String(selectedValue)
    );
  }

  if (field.type === "multiSelect") {
    const selected = Array.isArray(draft[field.key])
      ? (draft[field.key] as string[])
      : [];
    if (!selected.length) return "All";
    if (selected.length === 1) {
      return (
        field.options.find((option) => option.value === selected[0])?.label ??
        selected[0]
      );
    }
    return `${selected.length} selected`;
  }

  if (field.type === "numberRange") {
    const minValue = draft[field.minKey];
    const maxValue = draft[field.maxKey];
    if (typeof minValue !== "number" && typeof maxValue !== "number")
      return "Any amount";
    const minLabel = typeof minValue === "number" ? String(minValue) : "Any";
    const maxLabel = typeof maxValue === "number" ? String(maxValue) : "Any";
    return `${minLabel} - ${maxLabel}`;
  }

  return "All";
}

function useViewportMode() {
  const [mode, setMode] = useState<ViewportMode>(() => {
    if (typeof window === "undefined") return "desktop";
    return getViewportMode(window.innerWidth);
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setMode(getViewportMode(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return mode;
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
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const showInlineCalendar = viewportMode === "desktop";
  const [openAccordionItem, setOpenAccordionItem] = useState<
    string | undefined
  >(() => {
    const firstField = schema[0];
    return firstField ? getFieldId(firstField) : undefined;
  });

  const dateRangeField = useMemo(
    () => schema.find((field) => field.type === "dateRange") ?? null,
    [schema],
  );

  const dateRange = useMemo(() => {
    if (!dateRangeField || dateRangeField.type !== "dateRange")
      return undefined;
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

  const activeSummaries = useMemo(
    () =>
      schema
        .map((field) => ({
          id: getFieldId(field),
          label: field.label,
          summary: getFieldSummary(field, draft),
        }))
        .filter(
          ({ summary }) => !["All", "All time", "Any amount"].includes(summary),
        ),
    [draft, schema],
  );

  useEffect(() => {
    if (!open) return;
    const firstField = schema[0];
    setOpenAccordionItem(firstField ? getFieldId(firstField) : undefined);
  }, [open, schema]);

  const inputClassName =
    "min-h-[var(--filter-modal-touch-target)] rounded-[12px] border-[var(--filter-modal-border)] bg-[var(--filter-modal-surface)] px-3 text-[length:var(--filter-modal-font-size)] leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)] shadow-none transition focus-visible:border-[var(--filter-modal-accent)] focus-visible:ring-2 focus-visible:ring-[var(--filter-modal-focus)]";
  const fieldShellClassName =
    "space-y-[var(--filter-modal-spacing-2)] rounded-[var(--filter-modal-radius)] border border-[var(--filter-modal-border)] bg-[var(--filter-modal-surface-muted)] p-[var(--filter-modal-spacing-3)]";

  const renderFieldBody = (field: FilterField) => {
    if (field.type === "dateRange") {
      const fromValue =
        typeof draft[field.fromKey] === "string"
          ? String(draft[field.fromKey])
          : "";
      const toValue =
        typeof draft[field.toKey] === "string"
          ? String(draft[field.toKey])
          : "";
      const rangeSummary = hasDateRange
        ? `${fromValue ? formatDateLabel(fromValue) : "Start date"} -> ${toValue ? formatDateLabel(toValue) : "End date"}`
        : "All time";

      return (
        <div className="space-y-[var(--filter-modal-spacing-2)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--filter-modal-spacing-2)]">
            <p className="text-[length:var(--filter-modal-font-size)] font-semibold leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)]">
              {field.label}
            </p>
            <p
              className="text-[length:var(--filter-modal-font-size)] font-medium leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-muted)]"
              aria-live="polite"
            >
              {rangeSummary}
            </p>
          </div>

          <div className="grid gap-[var(--filter-modal-spacing-2)] sm:grid-cols-2">
            <label className="space-y-[var(--filter-modal-spacing-1)]">
              <span className="text-[length:var(--filter-modal-font-size)] font-medium leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-text)]">
                Start date
              </span>
              <Input
                type="date"
                value={fromValue}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    [field.fromKey]: event.target.value || null,
                  }))
                }
                className={inputClassName}
                aria-label={`${field.label} start date`}
              />
            </label>

            <label className="space-y-[var(--filter-modal-spacing-1)]">
              <span className="text-[length:var(--filter-modal-font-size)] font-medium leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-text)]">
                End date
              </span>
              <Input
                type="date"
                value={toValue}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    [field.toKey]: event.target.value || null,
                  }))
                }
                className={inputClassName}
                aria-label={`${field.label} end date`}
              />
            </label>
          </div>

          {showInlineCalendar ? (
            <div className="overflow-hidden rounded-[var(--filter-modal-radius)] border border-[var(--filter-modal-border)] bg-[var(--filter-modal-surface)] p-[var(--filter-modal-spacing-2)]">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(nextRange) => {
                  const from = nextRange?.from
                    ? toIsoDateString(nextRange.from)
                    : null;
                  const to = nextRange?.to
                    ? toIsoDateString(nextRange.to)
                    : null;
                  setDraft((prev) => ({
                    ...prev,
                    [field.fromKey]: from,
                    [field.toKey]: to,
                  }));
                }}
                numberOfMonths={1}
                fixedWeeks
                className="mx-auto w-fit p-0"
                classNames={{
                  months: "flex flex-col gap-[var(--filter-modal-spacing-2)]",
                  month: "space-y-[var(--filter-modal-spacing-2)]",
                  caption:
                    "relative flex min-h-[var(--filter-modal-touch-target)] items-center justify-center px-12",
                  caption_label:
                    "text-[length:var(--filter-modal-font-size)] font-semibold leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)]",
                  nav: "flex items-center gap-[var(--filter-modal-spacing-2)]",
                  nav_button:
                    "inline-flex h-[var(--filter-modal-touch-target)] w-[var(--filter-modal-touch-target)] items-center justify-center rounded-[12px] border border-[var(--filter-modal-border)] bg-[var(--filter-modal-surface-muted)] p-0 text-[var(--filter-modal-title)] opacity-100 transition hover:bg-[var(--filter-modal-surface)]",
                  nav_button_previous: "absolute left-0",
                  nav_button_next: "absolute right-0",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell:
                    "w-11 rounded-[12px] text-center text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--filter-modal-muted)]",
                  row: "mt-[var(--filter-modal-spacing-1)] flex w-full",
                  cell: "h-11 w-11 p-0 text-center text-[length:var(--filter-modal-font-size)]",
                  day: "inline-flex h-11 w-11 items-center justify-center rounded-[12px] text-[length:var(--filter-modal-font-size)] font-medium leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)] transition hover:bg-[var(--filter-modal-surface-muted)] aria-selected:opacity-100",
                  day_selected:
                    "bg-[var(--filter-modal-accent)] text-white hover:bg-[var(--filter-modal-accent-strong)] focus:bg-[var(--filter-modal-accent)] focus:text-white",
                  day_range_middle:
                    "bg-[color:rgba(4,17,51,0.10)] text-[var(--filter-modal-title)]",
                  day_today:
                    "border border-[var(--filter-modal-border-strong)] bg-[var(--filter-modal-surface)] text-[var(--filter-modal-title)]",
                  day_outside:
                    "text-[var(--filter-modal-muted)] opacity-50 aria-selected:bg-[color:rgba(4,17,51,0.08)]",
                  day_disabled: "text-[var(--filter-modal-muted)] opacity-30",
                }}
              />
            </div>
          ) : null}
        </div>
      );
    }

    if (field.type === "select") {
      const selectedValue =
        typeof draft[field.key] === "string" && String(draft[field.key]).length
          ? String(draft[field.key])
          : "all";

      return (
        <div className="space-y-[var(--filter-modal-spacing-2)]">
          <p className="text-[length:var(--filter-modal-font-size)] font-semibold leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)]">
            {field.label}
          </p>
          <Select
            value={selectedValue}
            onValueChange={(nextValue) =>
              setDraft((prev) => ({
                ...prev,
                [field.key]: nextValue === "all" ? null : nextValue,
              }))
            }
          >
            <SelectTrigger
              className={cn(inputClassName, "justify-between")}
              aria-label={`Select ${field.label.toLowerCase()}`}
            >
              <SelectValue
                placeholder={`Select ${field.label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent className="rounded-[12px] border-[var(--filter-modal-border)]">
              <SelectItem value="all">All</SelectItem>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === "multiSelect") {
      const selected = Array.isArray(draft[field.key])
        ? (draft[field.key] as string[])
        : [];

      return (
        <div className="space-y-[var(--filter-modal-spacing-2)]">
          <p className="text-[length:var(--filter-modal-font-size)] font-semibold leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)]">
            {field.label}
          </p>
          <div className="grid gap-[var(--filter-modal-spacing-2)]">
            {field.options.map((option) => {
              const checked = selected.includes(option.value);

              return (
                <label
                  key={option.value}
                  className="flex min-h-[var(--filter-modal-touch-target)] cursor-pointer items-center gap-[var(--filter-modal-spacing-2)] rounded-[12px] border border-[var(--filter-modal-border)] bg-[var(--filter-modal-surface)] px-3 py-2 text-[length:var(--filter-modal-font-size)] leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)] transition hover:border-[var(--filter-modal-border-strong)]"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => {
                      setDraft((prev) => {
                        const existing = Array.isArray(prev[field.key])
                          ? (prev[field.key] as string[])
                          : [];
                        const next = checked
                          ? existing.filter(
                              (selectedValue) => selectedValue !== option.value,
                            )
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
        </div>
      );
    }

    if (field.type === "numberRange") {
      const minValue = draft[field.minKey];
      const maxValue = draft[field.maxKey];

      return (
        <div className="space-y-[var(--filter-modal-spacing-2)]">
          <p className="text-[length:var(--filter-modal-font-size)] font-semibold leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)]">
            {field.label}
          </p>

          <div className="grid gap-[var(--filter-modal-spacing-2)] sm:grid-cols-2">
            <label className="space-y-[var(--filter-modal-spacing-1)]">
              <span className="text-[length:var(--filter-modal-font-size)] font-medium leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-text)]">
                {field.minLabel ?? "Min"}
              </span>
              <Input
                type="number"
                inputMode="numeric"
                value={typeof minValue === "number" ? String(minValue) : ""}
                onChange={(event) => {
                  const raw = event.target.value.trim();
                  setDraft((prev) => ({
                    ...prev,
                    [field.minKey]: raw ? Number(raw) : null,
                  }));
                }}
                className={inputClassName}
                aria-label={`${field.label} ${field.minLabel ?? "min"}`}
              />
            </label>

            <label className="space-y-[var(--filter-modal-spacing-1)]">
              <span className="text-[length:var(--filter-modal-font-size)] font-medium leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-text)]">
                {field.maxLabel ?? "Max"}
              </span>
              <Input
                type="number"
                inputMode="numeric"
                value={typeof maxValue === "number" ? String(maxValue) : ""}
                onChange={(event) => {
                  const raw = event.target.value.trim();
                  setDraft((prev) => ({
                    ...prev,
                    [field.maxKey]: raw ? Number(raw) : null,
                  }));
                }}
                className={inputClassName}
                aria-label={`${field.label} ${field.maxLabel ?? "max"}`}
              />
            </label>
          </div>
        </div>
      );
    }

    return null;
  };

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
      <DialogContent
        data-testid="filter-modal"
        data-layout={viewportMode}
        className="w-[calc(100vw-16px)] max-h-[92vh] gap-0 overflow-hidden rounded-[20px] border border-[var(--filter-modal-border)] bg-[var(--filter-modal-surface)] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.16)] [&>button]:right-2 [&>button]:top-2 [&>button]:inline-flex [&>button]:h-[var(--filter-modal-touch-target)] [&>button]:w-[var(--filter-modal-touch-target)] [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:text-[var(--filter-modal-muted)] sm:w-[calc(100vw-48px)] md:max-w-[40vw] lg:max-w-[60vw]"
      >
        <DialogHeader className="gap-[var(--filter-modal-spacing-1)] border-b border-[var(--filter-modal-border)] px-[var(--filter-modal-spacing-3)] py-[var(--filter-modal-spacing-3)] text-left sm:px-[var(--filter-modal-spacing-4)]">
          <DialogTitle className="pr-12 text-[length:var(--filter-modal-font-size)] font-semibold leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)]">
            {title}
          </DialogTitle>
          <DialogDescription className="pr-12 text-[length:var(--filter-modal-font-size)] leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-muted)]">
            Refine results with compact filters that stay consistent across
            screen sizes.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-[var(--filter-modal-spacing-3)] py-[var(--filter-modal-spacing-3)] sm:px-[var(--filter-modal-spacing-4)]">
          <div className="space-y-[var(--filter-modal-spacing-3)]">
            {activeSummaries.length ? (
              <div className="flex flex-wrap gap-[var(--filter-modal-spacing-2)]">
                {activeSummaries.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex min-h-[var(--filter-modal-touch-target)] items-center rounded-full border border-[var(--filter-modal-border)] bg-[var(--filter-modal-surface-muted)] px-3 text-[length:var(--filter-modal-font-size)] font-medium leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-text)]"
                  >
                    {item.label}: {item.summary}
                  </span>
                ))}
              </div>
            ) : null}

            {isMobile ? (
              <Accordion
                type="single"
                collapsible
                value={openAccordionItem}
                onValueChange={(nextValue) =>
                  setOpenAccordionItem(nextValue || undefined)
                }
                className="rounded-[20px] border border-[var(--filter-modal-border)] bg-[var(--filter-modal-surface)]"
              >
                {schema.map((field) => (
                  <AccordionItem
                    key={getFieldId(field)}
                    value={getFieldId(field)}
                    className="border-[var(--filter-modal-border)]"
                  >
                    <AccordionTrigger className="min-h-[var(--filter-modal-touch-target)] px-[var(--filter-modal-spacing-3)] py-[var(--filter-modal-spacing-2)] text-left hover:no-underline">
                      <div className="space-y-[var(--filter-modal-spacing-1)]">
                        <p className="text-[length:var(--filter-modal-font-size)] font-semibold leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-title)]">
                          {field.label}
                        </p>
                        <p className="text-[length:var(--filter-modal-font-size)] font-medium leading-[var(--filter-modal-line-height)] text-[var(--filter-modal-muted)]">
                          {getFieldSummary(field, draft)}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-[var(--filter-modal-spacing-3)] pb-[var(--filter-modal-spacing-3)] pt-0">
                      <div className={fieldShellClassName}>
                        {renderFieldBody(field)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div
                className={cn(
                  "grid gap-[var(--filter-modal-spacing-3)]",
                  viewportMode === "desktop"
                    ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]"
                    : "",
                )}
              >
                {dateRangeField && dateRangeField.type === "dateRange" ? (
                  <section
                    className={cn(
                      fieldShellClassName,
                      viewportMode === "desktop" ? "lg:h-full" : "",
                    )}
                  >
                    {renderFieldBody(dateRangeField)}
                  </section>
                ) : null}

                <div className="grid gap-[var(--filter-modal-spacing-3)]">
                  {schema
                    .filter((field) => field.type !== "dateRange")
                    .map((field) => (
                      <section
                        key={getFieldId(field)}
                        className={fieldShellClassName}
                      >
                        {renderFieldBody(field)}
                      </section>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-[var(--filter-modal-spacing-2)] border-t border-[var(--filter-modal-border)] px-[var(--filter-modal-spacing-3)] py-[var(--filter-modal-spacing-3)] sm:flex-row sm:items-center sm:justify-between sm:px-[var(--filter-modal-spacing-4)]">
          <Button
            type="button"
            variant="outline"
            className="min-h-[var(--filter-modal-touch-target)] rounded-[12px] border-[var(--filter-modal-border)] text-[length:var(--filter-modal-font-size)] text-[var(--filter-modal-muted)]"
            onClick={() => {
              setDraft(value);
              onReset();
              onOpenChange(false);
            }}
          >
            Reset
          </Button>
          <div className="flex flex-col gap-[var(--filter-modal-spacing-2)] sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="min-h-[var(--filter-modal-touch-target)] rounded-[12px] border-[var(--filter-modal-border)] text-[length:var(--filter-modal-font-size)] text-[var(--filter-modal-muted)]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-[var(--filter-modal-touch-target)] rounded-[12px] bg-[var(--filter-modal-accent)] px-4 text-[length:var(--filter-modal-font-size)] text-white hover:bg-[var(--filter-modal-accent-strong)]"
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
