import { REPORT_RANGE_PRESETS } from "@/features/reports/date-ranges";
import { getTranslations } from "next-intl/server";

export async function ReportRangeSelector({
  currentPreset,
  currentFrom,
  currentTo,
}: {
  currentPreset: string;
  currentFrom?: string;
  currentTo?: string;
}) {
  const tReports = await getTranslations("reports.range");
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="range" className="text-sm font-medium text-neutral-700">
          {tReports("label")}
        </label>
        <select
          id="range"
          name="range"
          defaultValue={currentPreset}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
        >
          {REPORT_RANGE_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {tReports(preset)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="from" className="text-sm font-medium text-neutral-700">
          {tReports("from")}
        </label>
        <input
          id="from"
          type="date"
          name="from"
          defaultValue={currentFrom}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="to" className="text-sm font-medium text-neutral-700">
          {tReports("to")}
        </label>
        <input
          id="to"
          type="date"
          name="to"
          defaultValue={currentTo}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-900"
      >
        {tReports("apply")}
      </button>
    </form>
  );
}
