import { getTranslations } from "next-intl/server";

export const REPORT_RANGE_PRESETS = [
  "thisMonth",
  "lastMonth",
  "last3Months",
  "last6Months",
  "thisYear",
  "custom",
] as const;
export type ReportRangePreset = (typeof REPORT_RANGE_PRESETS)[number];

export async function getReportRangeLabel(preset: ReportRangePreset): Promise<string> {
  const t = await getTranslations("reports.range");
  return t(preset);
}

/** Resolves a named preset (or an explicit custom range) into concrete from/to Dates. */
export function resolveReportDateRange(
  preset: ReportRangePreset,
  custom?: { from?: Date; to?: Date },
): { from: Date; to: Date } {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (preset) {
    case "thisMonth":
      return { from: startOfThisMonth, to: now };

    case "lastMonth": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { from, to };
    }

    case "last3Months":
      return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: now };

    case "last6Months":
      return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to: now };

    case "thisYear":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };

    case "custom":
      return {
        from: custom?.from ?? startOfThisMonth,
        to: custom?.to ?? now,
      };

    default:
      return { from: startOfThisMonth, to: now };
  }
}
