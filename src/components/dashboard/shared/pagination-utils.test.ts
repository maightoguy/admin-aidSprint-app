import { describe, expect, it } from "vitest";
import { clampPage, getTotalPages, paginateItems } from "./pagination-utils";

describe("pagination-utils", () => {
  it("calculates page counts safely", () => {
    expect(getTotalPages(0, 5)).toBe(1);
    expect(getTotalPages(5, 5)).toBe(1);
    expect(getTotalPages(11, 5)).toBe(3);
  });

  it("clamps page values into a valid range", () => {
    expect(clampPage(0, 4)).toBe(1);
    expect(clampPage(3, 4)).toBe(3);
    expect(clampPage(9, 4)).toBe(4);
  });

  it("paginates data and falls back to the last available page", () => {
    const source = Array.from({ length: 12 }, (_, index) => index + 1);

    expect(paginateItems(source, 2, 5)).toEqual({
      page: 2,
      totalPages: 3,
      items: [6, 7, 8, 9, 10],
    });

    expect(paginateItems(source, 9, 5)).toEqual({
      page: 3,
      totalPages: 3,
      items: [11, 12],
    });
  });
});
