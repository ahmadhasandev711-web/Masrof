import { describe, it, expect } from "vitest";
import { advanceDueDate, getDaysInMonth } from "./due-date";

describe("getDaysInMonth", () => {
  it("returns correct days for standard months", () => {
    expect(getDaysInMonth(2026, 0)).toBe(31); // Jan
    expect(getDaysInMonth(2026, 1)).toBe(28); // Feb non-leap
    expect(getDaysInMonth(2028, 1)).toBe(29); // Feb leap
    expect(getDaysInMonth(2026, 3)).toBe(30); // Apr
  });
});

describe("advanceDueDate", () => {
  it("advances standard monthly dates correctly", () => {
    const jan15 = new Date(2026, 0, 15);
    const next = advanceDueDate(jan15, "monthly", 15);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(15);
  });

  it("clamps to Feb 28 on non-leap years when day is 31", () => {
    const jan31 = new Date(2026, 0, 31);
    const next = advanceDueDate(jan31, "monthly", 31);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(28);
  });

  it("clamps to Feb 29 on leap years when day is 31", () => {
    const jan31 = new Date(2028, 0, 31);
    const next = advanceDueDate(jan31, "monthly", 31);
    expect(next.getFullYear()).toBe(2028);
    expect(next.getMonth()).toBe(1); // Feb
    expect(next.getDate()).toBe(29);
  });

  it("recovers 31st of month in March after being clamped in February", () => {
    const feb28 = new Date(2026, 1, 28);
    const next = advanceDueDate(feb28, "monthly", 31);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(2); // March
    expect(next.getDate()).toBe(31);
  });

  it("clamps to April 30 when day is 31", () => {
    const mar31 = new Date(2026, 2, 31);
    const next = advanceDueDate(mar31, "monthly", 31);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(30);
  });

  it("handles year rollover from December to January", () => {
    const dec31 = new Date(2026, 11, 31);
    const next = advanceDueDate(dec31, "monthly", 31);
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(0); // Jan
    expect(next.getDate()).toBe(31);
  });

  it("advances weekly by 7 days when dayOfWeek matches current day", () => {
    // 2026-01-14 is a Wednesday (day 3)
    const wednesday = new Date(2026, 0, 14);
    const next = advanceDueDate(wednesday, "weekly", undefined, 3);
    expect(next.getDate()).toBe(21);
    expect(next.getDay()).toBe(3);
  });

  it("advances weekly to next target weekday", () => {
    // 2026-01-14 is Wednesday (day 3), target Friday (day 5)
    const wednesday = new Date(2026, 0, 14);
    const next = advanceDueDate(wednesday, "weekly", undefined, 5);
    expect(next.getDate()).toBe(16);
    expect(next.getDay()).toBe(5);
  });
});
