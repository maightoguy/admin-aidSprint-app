import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { FilterField, FiltersState } from "./filter-schema";
import { isNonEmpty, isValidIsoDate } from "./filter-schema";

type UseUrlFiltersOptions = {
  schema: FilterField[];
  defaults?: FiltersState;
};

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getArray(params: URLSearchParams, key: string) {
  const values = params.getAll(key).map((value) => value.trim()).filter(Boolean);
  return values.length ? values : null;
}

export function useUrlFilters({ schema, defaults = {} }: UseUrlFiltersOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<FiltersState>(() => {
    const parsed: FiltersState = { ...defaults };

    for (const field of schema) {
      if (field.type === "dateRange") {
        const fromValue = searchParams.get(field.fromKey);
        const toValue = searchParams.get(field.toKey);
        parsed[field.fromKey] =
          fromValue && isValidIsoDate(fromValue) ? fromValue : null;
        parsed[field.toKey] = toValue && isValidIsoDate(toValue) ? toValue : null;
        continue;
      }

      if (field.type === "numberRange") {
        const min = searchParams.get(field.minKey);
        const max = searchParams.get(field.maxKey);
        parsed[field.minKey] = min ? toNumberOrNull(min) : null;
        parsed[field.maxKey] = max ? toNumberOrNull(max) : null;
        continue;
      }

      if (field.type === "multiSelect") {
        parsed[field.key] = getArray(searchParams, field.key);
        continue;
      }

      parsed[field.key] = searchParams.get(field.key) ?? defaults[field.key] ?? null;
    }

    return parsed;
  }, [defaults, schema, searchParams]);

  const setFilterValue = useCallback(
    (key: string, value: FiltersState[string]) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete(key);

        if (Array.isArray(value)) {
          for (const entry of value) {
            if (isNonEmpty(entry)) next.append(key, entry);
          }
          return next;
        }

        if (typeof value === "number") {
          if (Number.isFinite(value)) next.set(key, String(value));
          return next;
        }

        if (isNonEmpty(value)) {
          next.set(key, value);
          return next;
        }

        return next;
      });
    },
    [setSearchParams],
  );

  const setMany = useCallback(
    (values: FiltersState) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(values)) {
          next.delete(key);
          if (Array.isArray(value)) {
            for (const entry of value) {
              if (isNonEmpty(entry)) next.append(key, entry);
            }
            continue;
          }

          if (typeof value === "number") {
            if (Number.isFinite(value)) next.set(key, String(value));
            continue;
          }

          if (isNonEmpty(value)) {
            next.set(key, value);
          }
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const reset = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const field of schema) {
        if (field.type === "dateRange") {
          next.delete(field.fromKey);
          next.delete(field.toKey);
          continue;
        }

        if (field.type === "numberRange") {
          next.delete(field.minKey);
          next.delete(field.maxKey);
          continue;
        }

        next.delete(field.key);
      }
      return next;
    });
  }, [schema, setSearchParams]);

  return {
    filters,
    setFilterValue,
    setMany,
    reset,
  };
}

