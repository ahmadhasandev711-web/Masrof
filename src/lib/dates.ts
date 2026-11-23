/** Calendar-day comparison in the user's local timezone (not UTC midnight tricks). */
export function startOfLocalDay(date: Date | string) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function isOnOrBeforeToday(date: Date | string, now = new Date()) {
  return startOfLocalDay(date).getTime() <= startOfLocalDay(now).getTime();
}

export { isOnOrBeforeDaysFromToday } from "@contracts/shared/clients-projects";

export function endOfLocalDay(date: Date | string) {
  const value = startOfLocalDay(date);
  value.setHours(23, 59, 59, 999);
  return value;
}
