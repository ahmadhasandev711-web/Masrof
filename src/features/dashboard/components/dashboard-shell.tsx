"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { InstallPwaButton } from "@/features/dashboard/components/install-pwa-button";
import type { PlanId } from "@/features/subscriptions/plans";

type IconKey =
  | "home"
  | "transactions"
  | "invoices"
  | "clients"
  | "projects"
  | "reports"
  | "accounts"
  | "debts"
  | "budgets"
  | "goals"
  | "team"
  | "categories"
  | "backup"
  | "plan"
  | "settings"
  | "more"
  | "plus";

function NavIcon({ name, className = "h-5 w-5" }: { name: IconKey; className?: string }) {
  switch (name) {
    case "home":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "transactions":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case "invoices":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "clients":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "projects":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case "reports":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "accounts":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case "debts":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "budgets":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      );
    case "goals":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "team":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "categories":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case "backup":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      );
    case "plan":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "more":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case "plus":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      );
  }
}

const NAV_ITEMS: Array<{ href: string; labelKey: string; icon: IconKey; exact?: boolean }> = [
  { href: "/dashboard", labelKey: "home", icon: "home", exact: true },
  { href: "/dashboard/transactions", labelKey: "transactions", icon: "transactions" },
  { href: "/dashboard/invoices", labelKey: "invoices", icon: "invoices" },
  { href: "/dashboard/clients", labelKey: "clients", icon: "clients" },
  { href: "/dashboard/projects", labelKey: "projects", icon: "projects" },
  { href: "/dashboard/reports", labelKey: "reports", icon: "reports" },
];

const MORE_GROUPS = [
  {
    titleAr: "المالية والحسابات",
    titleEn: "Finance & Accounts",
    items: [
      { href: "/dashboard/accounts", labelKey: "accounts", icon: "accounts" as IconKey },
      { href: "/dashboard/debts", labelKey: "debts", icon: "debts" as IconKey },
      { href: "/dashboard/budgets", labelKey: "budgets", icon: "budgets" as IconKey },
      { href: "/dashboard/goals", labelKey: "goals", icon: "goals" as IconKey },
      { href: "/dashboard/categories", labelKey: "categories", icon: "categories" as IconKey },
    ],
  },
  {
    titleAr: "العملاء والمشاريع",
    titleEn: "Clients & Projects",
    items: [
      { href: "/dashboard/clients", labelKey: "clients", icon: "clients" as IconKey },
      { href: "/dashboard/projects", labelKey: "projects", icon: "projects" as IconKey },
      { href: "/dashboard/workspaces/members", labelKey: "team", icon: "team" as IconKey },
    ],
  },
  {
    titleAr: "النظام والاشتراك",
    titleEn: "System & Plan",
    items: [
      { href: "/dashboard/plan", labelKey: "plan", icon: "plan" as IconKey },
      { href: "/dashboard/backup", labelKey: "backup", icon: "backup" as IconKey },
      { href: "/dashboard/settings", labelKey: "settings", icon: "settings" as IconKey },
    ],
  },
];

const DESKTOP_MORE_ITEMS: Array<{ href: string; labelKey: string; icon: IconKey }> = [
  { href: "/dashboard/accounts", labelKey: "accounts", icon: "accounts" },
  { href: "/dashboard/debts", labelKey: "debts", icon: "debts" },
  { href: "/dashboard/budgets", labelKey: "budgets", icon: "budgets" },
  { href: "/dashboard/goals", labelKey: "goals", icon: "goals" },
  { href: "/dashboard/categories", labelKey: "categories", icon: "categories" },
  { href: "/dashboard/workspaces/members", labelKey: "team", icon: "team" },
  { href: "/dashboard/plan", labelKey: "plan", icon: "plan" },
  { href: "/dashboard/backup", labelKey: "backup", icon: "backup" },
  { href: "/dashboard/settings", labelKey: "settings", icon: "settings" },
];

type WorkspaceOption = {
  id: string;
  name: string;
  type: string;
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon,
  exact,
  className,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: IconKey;
  exact?: boolean;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
        active
          ? "bg-[#065F46] text-white font-bold shadow-sm shadow-[#065F46]/25"
          : "text-[#1C1B1A]/70 hover:bg-[#F3F0E8] hover:text-[#065F46] font-medium"
      } ${className ?? ""}`}
    >
      <NavIcon
        name={icon}
        className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-neutral-500"}`}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function QuickAddActionSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const quickActions = [
    {
      href: "/dashboard/invoices",
      title: "فاتورة جديدة",
      desc: "إنشاء وإرسال فاتورة جديدة للعميل",
      icon: "🧾",
      bgColor: "bg-emerald-50 text-emerald-800",
    },
    {
      href: "/dashboard/transactions",
      title: "تسجيل قيد أو مصروف",
      desc: "إضافة مصروف فوري أو إيراد للحساب",
      icon: "💸",
      bgColor: "bg-rose-50 text-rose-800",
    },
    {
      href: "/dashboard/debts",
      title: "تسجيل سداد أو دين جديد",
      desc: "متابعة الالتزامات والديون وسدادها",
      icon: "📑",
      bgColor: "bg-amber-50 text-amber-800",
    },
    {
      href: "/dashboard/clients",
      title: "إضافة عميل جديد",
      desc: "تسجيل بيانات عميل والتواصل معه",
      icon: "👤",
      bgColor: "bg-sky-50 text-sky-800",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-[#E4DFD3] bg-[#FBF9F4] pb-[max(2rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))] shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="mx-auto my-2.5 h-1.5 w-12 rounded-full bg-neutral-300" />
        <div className="flex items-center justify-between border-b border-[#E4DFD3] px-5 py-3">
          <p className="font-bold text-[#065F46] text-base">إجراء سريع</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-200/50"
          >
            إغلاق
          </button>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {quickActions.map((action) => (
            <Link
              key={action.href + action.title}
              href={action.href}
              onClick={onClose}
              className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs transition hover:border-[#065F46]/40 active:scale-98"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${action.bgColor}`}>
                {action.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-neutral-900 text-sm">{action.title}</p>
                <p className="text-xs text-neutral-500 truncate">{action.desc}</p>
              </div>
              <span className="text-neutral-400 text-sm">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMoreSheet({
  open,
  onClose,
  tNav,
}: {
  open: boolean;
  onClose: () => void;
  tNav: ReturnType<typeof useTranslations<"nav">>;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        aria-label={tNav("closeMenu")}
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-[#E4DFD3] bg-[#FBF9F4] pb-[max(2rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))] shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="mx-auto my-2.5 h-1.5 w-12 rounded-full bg-neutral-300" />
        <div className="sticky top-0 flex items-center justify-between border-b border-[#E4DFD3] bg-[#FBF9F4]/95 backdrop-blur-md px-5 py-3 z-10">
          <p className="font-bold text-[#065F46] text-base">{tNav("more")}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-200/50"
          >
            {tNav("closeMenu")}
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {MORE_GROUPS.map((group) => (
            <div key={group.titleAr} className="flex flex-col gap-1.5">
              <p className="px-1 text-xs font-bold text-neutral-400">{group.titleAr}</p>
              <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs divide-y divide-neutral-100">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center justify-between p-3.5 text-sm font-medium text-neutral-800 transition hover:bg-[#FBF9F4] active:bg-[#ECFDF5]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                        <NavIcon name={item.icon} className="h-4.5 w-4.5" />
                      </div>
                      <span>{tNav(item.labelKey)}</span>
                    </div>
                    <span className="text-neutral-400">›</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  userName,
  planId,
  planViaTeam = false,
  personalPlanId,
  workspaces,
  activeWorkspaceId,
  isAdmin = false,
}: {
  children: React.ReactNode;
  userName: string;
  planId?: PlanId;
  planViaTeam?: boolean;
  personalPlanId?: PlanId;
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
  isAdmin?: boolean;
}) {
  const tNav = useTranslations("nav");
  const tPlans = useTranslations("plans");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const displayPlanId = planId;
  const planLabel = displayPlanId ? tPlans(displayPlanId) : undefined;
  const personalPlanLabel =
    planViaTeam && personalPlanId && personalPlanId !== planId
      ? tPlans(personalPlanId)
      : null;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-clip bg-[#FBF9F4] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] text-[#1C1B1A] lg:pb-8">
      {/* Header */}
      <header className="relative z-40 border-b border-[#E4DFD3]/80 bg-[#FBF9F4]/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:py-3 lg:px-8 lg:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold text-[#065F46]">
                <Image
                  src="/icons/brand-logo.png"
                  alt={tCommon("appName")}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain shrink-0 drop-shadow-xs"
                />
                <span>{tCommon("appName")}</span>
              </Link>
              <p className="truncate text-xs text-[#1C1B1A]/50 mt-0.5">
                {tNav("greeting", { name: userName })}
                {planLabel ? (
                  <Link
                    href="/dashboard/plan"
                    className={`ms-1 rounded px-1.5 py-0.5 ${
                      planId !== "free"
                        ? "bg-violet-50 text-violet-700 font-semibold"
                        : "text-[#065F46] hover:underline"
                    }`}
                    title={planViaTeam ? tPlans("viaTeamHint") : undefined}
                  >
                    {planLabel}
                    {planViaTeam ? ` · ${tPlans("viaTeam")}` : ""}
                  </Link>
                ) : null}
              </p>
              {personalPlanLabel ? (
                <p className="truncate text-xs text-[#1C1B1A]/40">
                  ({tPlans("yourPlan", { plan: personalPlanLabel })})
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <LocaleSwitcher />
              <InstallPwaButton compact />
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="hidden rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm text-violet-800 transition hover:bg-violet-100 sm:inline-block"
                >
                  {tNav("admin")}
                </Link>
              ) : null}
              <div className="hidden lg:block">
                <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
              </div>
              <SignOutButton compact />
            </div>
          </div>
          <div className="relative z-50 mt-2 flex items-center gap-2 lg:hidden">
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspaceId}
              className="min-w-0 flex-1"
            />
            {isAdmin ? (
              <Link
                href="/admin"
                className="shrink-0 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs text-violet-800"
              >
                {tNav("admin")}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4 sm:py-6 lg:px-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain pr-1 pl-1 space-y-1 pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} label={tNav(item.labelKey)} />
            ))}
            <div className="my-2 border-t border-neutral-200" />
            <p className="px-3 py-1 text-xs font-semibold text-neutral-400">{tNav("more")}</p>
            {DESKTOP_MORE_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} label={tNav(item.labelKey)} />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Native-Grade Mobile Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E4DFD3] bg-[#FBF9F4]/98 pb-[max(0.85rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-2 pb-0.5">
          {/* 1. Home */}
          <Link
            href="/dashboard"
            prefetch={true}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 transition active:scale-95 ${
              isActive(pathname, "/dashboard", true) ? "text-[#065F46]" : "text-[#1C1B1A]/60 hover:text-[#065F46]"
            }`}
          >
            <NavIcon name="home" className="h-5 w-5" />
            <span className="text-[10px] font-semibold truncate">{tNav("home")}</span>
          </Link>

          {/* 2. Transactions */}
          <Link
            href="/dashboard/transactions"
            prefetch={true}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 transition active:scale-95 ${
              isActive(pathname, "/dashboard/transactions") ? "text-[#065F46]" : "text-[#1C1B1A]/60 hover:text-[#065F46]"
            }`}
          >
            <NavIcon name="transactions" className="h-5 w-5" />
            <span className="text-[10px] font-semibold truncate">{tNav("transactions")}</span>
          </Link>

          {/* 3. Floating Quick Action Button (+) */}
          <div className="flex shrink-0 items-center justify-center px-1">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              aria-label="إجراء سريع"
              className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#064E3B] to-[#059669] text-white shadow-lg shadow-emerald-950/30 ring-4 ring-[#FBF9F4] transition active:scale-90"
            >
              <NavIcon name="plus" className="h-6 w-6" />
            </button>
          </div>

          {/* 4. Invoices */}
          <Link
            href="/dashboard/invoices"
            prefetch={true}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 transition active:scale-95 ${
              isActive(pathname, "/dashboard/invoices") ? "text-[#065F46]" : "text-[#1C1B1A]/60 hover:text-[#065F46]"
            }`}
          >
            <NavIcon name="invoices" className="h-5 w-5" />
            <span className="text-[10px] font-semibold truncate">{tNav("invoices")}</span>
          </Link>

          {/* 5. More */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label={tNav("more")}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 text-[#1C1B1A]/60 transition hover:text-[#065F46] active:scale-95"
          >
            <NavIcon name="more" className="h-5 w-5" />
            <span className="text-[10px] font-semibold truncate">{tNav("more")}</span>
          </button>
        </div>
      </nav>

      <QuickAddActionSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} tNav={tNav} />
    </div>
  );
}
