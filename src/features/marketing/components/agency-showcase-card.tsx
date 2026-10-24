import type { AppLocale } from "@/i18n/config";

export function AgencyShowcaseCard({ locale = "ar" }: { locale?: AppLocale }) {
  const isEn = locale === "en";

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Dynamic ambient backdrop glow */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-emerald-600/25 via-teal-500/15 to-emerald-800/20 blur-xl opacity-80" />

      {/* Main Agency Invoice Mockup */}
      <div className="relative rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-2xl shadow-emerald-950/10 sm:p-7 backdrop-blur-sm">
        {/* Top bar with business branding & invoice tag */}
        <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-sm font-black text-white shadow-sm shadow-emerald-900/20">
              {isEn ? "S" : "س"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-neutral-900 text-sm sm:text-base leading-tight">
                  {isEn ? "Madar Creative Agency" : "استوديو مدار كرييتف"}
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200/60">
                  {isEn ? "Verified" : "موثّق"}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {isEn ? "Design & Development Studio" : "استوديو التصميم والتطوير البرمجي"}
              </p>
            </div>
          </div>
          <div className={isEn ? "text-right" : "text-left"}>
            <span className="inline-block rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-mono font-bold text-neutral-700 border border-neutral-200/70">
              #SND-2026-104
            </span>
            <p className="mt-1 text-[11px] font-medium text-emerald-700">
              {isEn ? "Issued via Sanadat" : "صادرة عبر سندات"}
            </p>
          </div>
        </div>

        {/* Client & Project Info */}
        <div className="mt-4 rounded-xl bg-[#FBF9F4] p-3.5 border border-neutral-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                {isEn ? "Client" : "العميل"}
              </p>
              <p className="font-bold text-neutral-900 text-sm mt-0.5">
                {isEn ? "Horizon Digital Co." : "شركة أفق الرقمية"}
              </p>
            </div>
            <div className={isEn ? "text-right" : "text-left"}>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                {isEn ? "Project" : "المشروع"}
              </p>
              <p className="font-semibold text-emerald-800 text-sm mt-0.5">
                {isEn ? "Platform Launch" : "إطلاق المنصة الإلكترونية"}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Items summary */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-dashed border-neutral-200 text-neutral-600">
            <span className="font-medium text-neutral-700">
              {isEn
                ? "UI/UX Design & Prototyping"
                : "تصميم واجهات وتجربة المستخدم (UI/UX)"}
            </span>
            <span className="font-bold text-neutral-900 font-mono">
              {isEn ? "8,500 EGP" : "٨,٥٠٠ ج.م"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-dashed border-neutral-200 text-neutral-600">
            <span className="font-medium text-neutral-700">
              {isEn
                ? "Frontend & API Integration"
                : "تطوير الواجهة الأمامية وربط الـ API"}
            </span>
            <span className="font-bold text-neutral-900 font-mono">
              {isEn ? "6,500 EGP" : "٦,٥٠٠ ج.م"}
            </span>
          </div>
        </div>

        {/* Total & Status Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/70 p-4 border border-emerald-200/70">
          <div>
            <p className="text-[11px] text-emerald-900/75 font-semibold">
              {isEn ? "Total Amount" : "إجمالي القيمة المستحقة"}
            </p>
            <p className="text-2xl font-black text-emerald-950 font-mono tracking-tight mt-0.5">
              {isEn ? "15,000 EGP" : "١٥,٠٠٠ ج.م"}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-3 py-1 text-xs font-bold text-white shadow-xs">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{isEn ? "Fully Paid" : "مدفوعة بالكامل"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/90 px-2.5 py-0.5 text-[11px] font-semibold text-sky-900 border border-sky-200/60">
              <span className="text-sky-600 font-bold tracking-tighter"></span>
              <span>{isEn ? "Delivered & Read on WhatsApp" : "تم الاستلام والمشاهدة عبر واتساب"}</span>
            </span>
          </div>
        </div>

        {/* Project Profitability & Instant Link */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-600">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-neutral-500">{isEn ? "Net Margin:" : "هامش الربح الصافي:"}</span>
            <span className="font-bold text-emerald-800 font-mono">
              {isEn ? "+84% (+12,600 EGP)" : "+84% (+١٢,٦٠٠ ج.م)"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
            <span></span>
            <span>{isEn ? "Encrypted Link" : "رابط دفع مشفر"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
