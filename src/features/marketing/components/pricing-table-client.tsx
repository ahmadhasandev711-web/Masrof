"use client";

import { useState } from "react";
import Link from "next/link";
import type { LocalizedPlan } from "@/i18n/plans-localized";

export interface PricingTableProps {
  freePlan: LocalizedPlan;
  proPlan: LocalizedPlan;
  yearlyPriceDisplay: string;
  yearlyPeriodDisplay: string;
  billingMonthly: string;
  billingYearly: string;
  yearlyDiscountBadge: string;
  featureMatrixTitle: string;
  featureMatrixSubtitle: string;
  freeForever: string;
  proFullAccess: string;
  unlimited: string;
  included: string;
  notIncluded: string;
  matrix: {
    workspaces: string;
    workspacesFree: string;
    workspacesPro: string;
    members: string;
    membersFree: string;
    membersPro: string;
    invoices: string;
    invoicesFree: string;
    invoicesPro: string;
    clients: string;
    clientsFree: string;
    clientsPro: string;
    budgets: string;
    budgetsFree: string;
    budgetsPro: string;
    printing: string;
    statements: string;
    whatsappShare: string;
    cashFlow: string;
    ocr: string;
    export: string;
    backup: string;
    debts: string;
    ads: string;
    adsFree: string;
    adsPro: string;
  };
  whatsappUrl: string;
  whatsappCta: string;
  upgradeNote: string;
  isArabic: boolean;
}

export function PricingTableClient({
  freePlan,
  proPlan,
  yearlyPriceDisplay,
  yearlyPeriodDisplay,
  billingMonthly,
  billingYearly,
  yearlyDiscountBadge,
  featureMatrixTitle,
  featureMatrixSubtitle,
  freeForever,
  proFullAccess,
  unlimited,
  included,
  notIncluded,
  matrix,
  whatsappUrl,
  whatsappCta,
  upgradeNote,
  isArabic,
}: PricingTableProps) {
  const matrixRows = [
    {
      feature: matrix.workspaces,
      free: matrix.workspacesFree,
      pro: matrix.workspacesPro,
      proHighlight: false,
    },
    {
      feature: matrix.members,
      free: matrix.membersFree,
      pro: matrix.membersPro,
      proHighlight: true,
    },
    {
      feature: matrix.invoices,
      free: matrix.invoicesFree,
      pro: matrix.invoicesPro,
      proHighlight: true,
    },
    {
      feature: matrix.clients,
      free: matrix.clientsFree,
      pro: matrix.clientsPro,
      proHighlight: true,
    },
    {
      feature: matrix.budgets,
      free: matrix.budgetsFree,
      pro: matrix.budgetsPro,
      proHighlight: true,
    },
    {
      feature: matrix.printing,
      free: included,
      pro: included,
      isBoolean: true,
    },
    {
      feature: matrix.statements,
      free: included,
      pro: included,
      isBoolean: true,
    },
    {
      feature: matrix.whatsappShare,
      free: notIncluded,
      pro: included,
      isBoolean: true,
      proHighlight: true,
    },
    {
      feature: matrix.cashFlow,
      free: notIncluded,
      pro: included,
      isBoolean: true,
      proHighlight: true,
    },
    {
      feature: matrix.ocr,
      free: notIncluded,
      pro: included,
      isBoolean: true,
      proHighlight: true,
    },
    {
      feature: matrix.export,
      free: notIncluded,
      pro: included,
      isBoolean: true,
      proHighlight: true,
    },
    {
      feature: matrix.backup,
      free: notIncluded,
      pro: included,
      isBoolean: true,
      proHighlight: true,
    },
    {
      feature: matrix.debts,
      free: notIncluded,
      pro: included,
      isBoolean: true,
      proHighlight: true,
    },
    {
      feature: matrix.ads,
      free: matrix.adsFree,
      pro: matrix.adsPro,
      proHighlight: true,
    },
  ];

  return (
    <div className="space-y-16">
      {/* ========================================================= */}
      {/* 1. ANNUAL BILLING BADGE                                   */}
      {/* ========================================================= */}
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs sm:text-sm font-bold text-emerald-900 shadow-2xs">
          <span>✨</span>
          <span>{yearlyDiscountBadge}</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PRICING CARDS                                          */}
      {/* ========================================================= */}
      <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
        {/* Free Plan Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 shadow-xs sm:p-8">
          <div>
            <span className="inline-block rounded-md bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700">
              {freeForever}
            </span>
            <h2 className="mt-3 text-2xl font-bold text-neutral-900">
              {freePlan.name}
            </h2>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-neutral-900 font-mono">
                {freePlan.priceDisplay}
              </span>
              <span className="text-sm font-medium text-neutral-500">
                {freePlan.periodDisplay}
              </span>
            </div>
            <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
              {freePlan.description}
            </p>

            <div className="mt-6 border-t border-neutral-100 pt-6">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {isArabic ? "أهم ما تشمله الباقة" : "What is included"}
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-neutral-700">
                {freePlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100">
            <Link
              href="/register"
              className="block w-full rounded-xl border border-neutral-300 bg-neutral-50 py-3.5 text-center text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 hover:border-neutral-400"
            >
              {freePlan.cta}
            </Link>
          </div>
        </div>

        {/* Pro Plan Card */}
        <div className="relative flex flex-col justify-between rounded-2xl border-2 border-emerald-800 bg-[#ECFDF5]/50 p-7 shadow-xl shadow-emerald-950/10 sm:p-8">
          <div className="absolute -top-3.5 left-6 rounded-full bg-emerald-800 px-3.5 py-1 text-xs font-bold text-white shadow-sm">
            {proFullAccess}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="inline-block rounded-md bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
                {isArabic ? "اشتراك سنوي شامل" : "Annual Plan"}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold text-emerald-950">
              {proPlan.name}
            </h2>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-950 font-mono">
                {proPlan.priceDisplay}
              </span>
              <span className="text-sm font-medium text-emerald-900/70">
                {proPlan.periodDisplay}
              </span>
            </div>

            <p className="mt-1 text-xs font-semibold text-emerald-700">
              {isArabic
                ? "٢٥٠ ج.م سنوياً فقط لكل ميزات النظام والفريق"
                : "250 EGP / year for all system & team features"}
            </p>

            <p className="mt-4 text-sm text-neutral-700 leading-relaxed">
              {proPlan.description}
            </p>

            <div className="mt-6 border-t border-emerald-200/60 pt-6">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                {isArabic ? "كل مزايا برو المفتوحة" : "All Pro unlocked features"}
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-emerald-950">
                {proPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <span className="text-emerald-700 font-black">✓</span>
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-emerald-200/60 space-y-3">
            <Link
              href="/register"
              className="block w-full rounded-xl bg-emerald-800 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-emerald-900/25 transition hover:bg-emerald-900 hover:scale-[1.01]"
            >
              {proPlan.cta}
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-emerald-700/40 bg-white py-3 text-center text-xs font-semibold text-emerald-850 transition hover:bg-emerald-50"
            >
              <span>💬</span>
              <span>{whatsappCta}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. DETAILED FEATURE MATRIX TABLE                          */}
      {/* ========================================================= */}
      <div className="mx-auto max-w-4xl pt-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h3 className="font-[family-name:var(--font-marketing-display)] text-2xl font-bold text-neutral-900 sm:text-3xl">
            {featureMatrixTitle}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            {featureMatrixSubtitle}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/90 text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  <th className={`py-4 px-6 ${isArabic ? "text-right" : "text-left"}`}>
                    {isArabic ? "الميزة / الأداة" : "Feature / Capability"}
                  </th>
                  <th className="py-4 px-6 text-center w-40">
                    <span className="inline-block rounded-md bg-neutral-200/70 px-2.5 py-1 text-xs font-bold text-neutral-800">
                      {freePlan.name}
                    </span>
                  </th>
                  <th className="py-4 px-6 text-center w-48 bg-emerald-50/70 text-emerald-950">
                    <span className="inline-block rounded-md bg-emerald-800 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                      {proPlan.name}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {matrixRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="transition hover:bg-neutral-50/70"
                  >
                    <td className={`py-4 px-6 font-medium text-neutral-900 ${isArabic ? "text-right" : "text-left"}`}>
                      {row.feature}
                    </td>

                    {/* Free Column */}
                    <td className="py-4 px-6 text-center text-xs text-neutral-600">
                      {row.isBoolean ? (
                        row.free === included ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-neutral-300 font-bold">—</span>
                        )
                      ) : (
                        <span>{row.free}</span>
                      )}
                    </td>

                    {/* Pro Column */}
                    <td className="py-4 px-6 text-center text-xs font-semibold bg-emerald-50/30 text-emerald-950">
                      {row.isBoolean ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-800 text-white font-bold shadow-xs">
                          ✓
                        </span>
                      ) : (
                        <span className={row.proHighlight ? "font-bold text-emerald-900" : ""}>
                          {row.pro}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. FOOTER NOTE & ENTERPRISE INQUIRY                      */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50 p-6 text-center max-w-2xl mx-auto">
        <p className="text-sm text-neutral-700">
          {upgradeNote}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-800 hover:underline"
          >
            {isArabic ? "محادثة فورية مع فريق الدعم ←" : "Direct chat with support →"}
          </a>
          <span className="text-neutral-300">•</span>
          <Link
            href="/support"
            className="font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
          >
            {isArabic ? "استفسارات الشركات والوكالات الكبرى" : "Enterprise & Custom inquiries"}
          </Link>
        </div>
      </div>
    </div>
  );
}
