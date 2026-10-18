import type { RecurringFrequency } from "@/models/recurring-expense";

/**
 * Returns the maximum number of days in the given year and month (0-indexed month).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Computes the next due date for a recurring expense without month-skipping bugs.
 * Correctly clamps end-of-month dates (e.g. Jan 31 -> Feb 28/29 -> Mar 31).
 */
export function advanceDueDate(
  current: Date,
  frequency: RecurringFrequency,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null,
): Date {
  const next = new Date(current);

  if (frequency === "monthly") {
    // The desired target day of month (1-31)
    const targetDay = dayOfMonth ?? current.getDate();

    const currentYear = current.getFullYear();
    const currentMonth = current.getMonth();
    const targetMonth = currentMonth + 1;

    // JavaScript Date constructor handles month > 11 by automatically incrementing year
    const targetDateObj = new Date(currentYear, targetMonth, 1);
    const newYear = targetDateObj.getFullYear();
    const newMonth = targetDateObj.getMonth();

    // Clamp to the max days available in the target month
    const maxDays = getDaysInMonth(newYear, newMonth);
    const finalDay = Math.min(targetDay, maxDays);

    next.setFullYear(newYear, newMonth, finalDay);
    return next;
  }

  // Weekly frequency
  const targetDayOfWeek = dayOfWeek ?? current.getDay();
  const currentDayOfWeek = current.getDay();
  const daysUntil = (targetDayOfWeek - currentDayOfWeek + 7) % 7 || 7;
  next.setDate(next.getDate() + daysUntil);
  return next;
}
