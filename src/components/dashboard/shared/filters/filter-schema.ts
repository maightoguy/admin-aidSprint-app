export type DateRangeFilterValue = {
  from: string | null;
  to: string | null;
};

export type SelectOption<T extends string = string> = {
  label: string;
  value: T;
};

export type BaseFilterField = {
  key: string;
  label: string;
};

export type DateRangeFilterField = BaseFilterField & {
  type: "dateRange";
  fromKey: string;
  toKey: string;
};

export type SelectFilterField<T extends string = string> = BaseFilterField & {
  type: "select";
  options: Array<SelectOption<T>>;
};

export type MultiSelectFilterField<T extends string = string> = BaseFilterField & {
  type: "multiSelect";
  options: Array<SelectOption<T>>;
};

export type NumberRangeFilterField = BaseFilterField & {
  type: "numberRange";
  minKey: string;
  maxKey: string;
  minLabel?: string;
  maxLabel?: string;
};

export type FilterField =
  | DateRangeFilterField
  | SelectFilterField
  | MultiSelectFilterField
  | NumberRangeFilterField;

export type FiltersState = Record<string, string | string[] | number | null | undefined>;

export function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidIsoDate(value: string) {
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

export function toIsoDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateForFilter(value: string) {
  const normalized = value.trim();
  const direct = Date.parse(normalized);
  if (!Number.isNaN(direct)) {
    return new Date(direct);
  }

  const normalizedWithCommas = normalized.replace(/(\d)(st|nd|rd|th)/gi, "$1");
  const secondAttempt = Date.parse(normalizedWithCommas);
  if (!Number.isNaN(secondAttempt)) {
    return new Date(secondAttempt);
  }

  return null;
}

export function isWithinInclusiveRange(
  date: Date,
  from: Date | null,
  to: Date | null,
) {
  const time = date.getTime();
  const fromTime = from ? from.getTime() : null;
  const toTime = to ? to.getTime() : null;

  if (fromTime != null && time < fromTime) return false;
  if (toTime != null && time > toTime) return false;
  return true;
}

