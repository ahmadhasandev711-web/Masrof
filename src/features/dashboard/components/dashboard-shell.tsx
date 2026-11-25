"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { InstallPwaButton } from "@/features/dashboard/components/install-pwa-button";
import type { PlanId } from "@/features/subscriptions/plans";
import { NavIcon, type NavIconKey } from "@/components/ui/app-icons";

type IconKey = NavIconKey;

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
          ? "bg-[#065F46] text-white font-bold shadow-sm shadow-[#065F46]/25 dark:bg-[#10B981] dark:text-[#04231A]"
          : "text-[#1C1B1A]/70 hover:bg-[#F3F0E8] hover:text-[#065F46] font-medium dark:text-[#9AA39F] dark:hover:bg-[#1E2824] dark:hover:text-[#34D399]"
      } ${className ?? ""}`}
    >
      <NavIcon
        name={icon}
        className={`h-5 w-5 shrink-0 ${active ? "text-white dark:text-[#04231A]" : "text-neutral-500 dark:text-[#66706B]"}`}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function QuickAddActionSheet({
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

  const quickActions = [
    {
      href: "/dashboard/invoices?action=new",
      title: tNav("quickActions.newInvoiceTitle"),
      desc: tNav("quickActions.newInvoiceDesc"),
      icon: "invoices" as IconKey,
      bgColor: "bg-emerald-50 text-emerald-800 dark:bg-[#0F2E24] dark:text-[#34D399]",
    },
    {
      href: "/dashboard/transactions?action=new-expense",
      title: tNav("quickActions.newTransactionTitle"),
      desc: tNav("quickActions.newTransactionDesc"),
      icon: "transactions" as IconKey,
      bgColor: "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
    },
    {
      href: "/dashboard/debts?action=new",
      title: tNav("quickActions.newDebtTitle"),
      desc: tNav("quickActions.newDebtDesc"),
      icon: "debts" as IconKey,
      bgColor: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    },
    {
      href: "/dashboard/clients?action=new",
      title: tNav("quickActions.newClientTitle"),
      desc: tNav("quickActions.newClientDesc"),
      icon: "clients" as IconKey,
      bgColor: "bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 transition-opacity"
        aria-label={tNav("quickActions.close")}
        onClick={onClose}
      />
      <div className="absolute native-bottom-sheet inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-[#E4DFD3] bg-[#FBF9F4] pb-[max(2rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))] shadow-2xl animate-in slide-in-from-bottom duration-200 dark:border-[#26302C] dark:bg-[#161E1B]">
        <div className="mx-auto my-2.5 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-[#26302C]" />
        <div className="flex items-center justify-between border-b border-[#E4DFD3] px-5 py-3 dark:border-[#26302C]">
          <p className="font-bold text-[#065F46] text-base dark:text-[#34D399]">{tNav("quickActions.title")}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-200/50 dark:text-[#9AA39F] dark:hover:bg-[#1E2824]"
          >
            {tNav("quickActions.close")}
          </button>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {quickActions.map((action) => (
            <Link
              key={action.href + action.title}
              href={action.href}
              onClick={onClose}
              className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs transition hover:border-[#065F46]/40 active:scale-98 dark:border-[#26302C] dark:bg-[#1E2824] dark:hover:border-[#34D399]/50"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${action.bgColor}`}>
                <NavIcon name={action.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-neutral-900 text-sm dark:text-[#ECEAE4]">{action.title}</p>
                <p className="text-xs text-neutral-500 truncate dark:text-[#9AA39F]">{action.desc}</p>
              </div>
              <span className="text-neutral-400 text-sm dark:text-[#66706B]">›</span>
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
  locale,
  userName,
  planLabel,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  tNav: ReturnType<typeof useTranslations<"nav">>;
  locale: string;
  userName?: string;
  planLabel?: string;
  isAdmin?: boolean;
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
        className="absolute inset-0 bg-black/60 transition-opacity"
        aria-label={tNav("closeMenu")}
        onClick={onClose}
      />
      <div className="absolute native-bottom-sheet inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-[#E4DFD3] bg-[#FBF9F4] pb-[max(2rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))] shadow-2xl animate-in slide-in-from-bottom duration-200 dark:border-[#26302C] dark:bg-[#161E1B]">
        <div className="mx-auto my-2.5 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-[#26302C]" />
        <div className="sticky top-0 flex items-center justify-between border-b border-[#E4DFD3] bg-[#FBF9F4] px-5 py-3 z-10 dark:border-[#26302C] dark:bg-[#161E1B]">
          <p className="font-bold text-[#065F46] text-base dark:text-[#34D399]">{tNav("more")}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-200/50 dark:text-[#9AA39F] dark:hover:bg-[#1E2824]"
          >
            {tNav("closeMenu")}
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {MORE_GROUPS.map((group) => (
            <div key={group.titleAr} className="flex flex-col gap-1.5">
              <p className="px-1 text-xs font-bold text-neutral-400 dark:text-[#66706B]">
                {locale.startsWith("en") ? group.titleEn : group.titleAr}
              </p>
              <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs divide-y divide-neutral-100 dark:border-[#26302C] dark:bg-[#1E2824] dark:divide-[#26302C]">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center justify-between p-3.5 text-sm font-medium text-neutral-800 transition hover:bg-[#FBF9F4] active:bg-[#ECFDF5] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]/60 dark:active:bg-[#0F2E24]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-[#161E1B] dark:text-[#9AA39F]">
                        <NavIcon name={item.icon} className="h-4.5 w-4.5" />
                      </div>
                      <span>{tNav(item.labelKey)}</span>
                    </div>
                    <span className="text-neutral-400 dark:text-[#66706B]">›</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* User Account & Session Card */}
          <div className="flex flex-col gap-1.5 pt-1">
            <p className="px-1 text-xs font-bold text-neutral-400 dark:text-[#66706B]">
              {locale.startsWith("en") ? "Account & Session" : "الحساب والجلسة"}
            </p>
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs flex items-center justify-between gap-3 dark:border-[#26302C] dark:bg-[#1E2824]">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 truncate dark:text-[#ECEAE4]">
                  {userName ? tNav("greeting", { name: userName }) : ""}
                </p>
                {planLabel && (
                  <p className="text-[11px] font-semibold text-emerald-800 mt-0.5 truncate dark:text-[#34D399]">
                    {planLabel}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-800 transition hover:bg-violet-100 dark:border-violet-800/60 dark:bg-violet-950/60 dark:text-violet-200"
                  >
                    {tNav("admin")}
                  </Link>
                )}
                <SignOutButton compact />
              </div>
            </div>
          </div>
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
  const locale = useLocale();
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
    <div
      data-theme-scope="app"
      className="min-h-screen w-full max-w-[100vw] overflow-x-clip bg-[#FBF9F4] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px)+var(--kb-height,0px))] text-[#1C1B1A] lg:pb-8 dark:bg-[#0E1412] dark:text-[#ECEAE4]"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E4DFD3]/80 bg-[#FBF9F4] lg:bg-[#FBF9F4]/95 lg:backdrop-blur-md pt-[env(safe-area-inset-top,0px)] dark:border-[#26302C] dark:bg-[#0E1412] dark:lg:bg-[#0E1412]/95">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:py-3 lg:px-8 lg:py-3.5">
          {/* Desktop & Tablet Header Row */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold text-[#065F46] shrink-0 dark:text-[#34D399]">
                <Image
                  src="/icons/brand-logo.png"
                  alt={tCommon("appName")}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain shrink-0 drop-shadow-xs"
                />
                <span>{tCommon("appName")}</span>
              </Link>

              <div className="h-4 w-px bg-neutral-200 dark:bg-[#26302C]" />

              <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />

              <p className="truncate text-xs text-[#1C1B1A]/50 dark:text-[#9AA39F]">
                {tNav("greeting", { name: userName })}
                {planLabel ? (
                  <Link
                    href="/dashboard/plan"
                    className={`ms-1.5 rounded px-2 py-0.5 text-[11px] font-semibold ${
                      planId !== "free"
                        ? "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800/60"
                        : "text-[#065F46] bg-emerald-50 border border-emerald-200 dark:bg-[#0F2E24] dark:text-[#34D399] dark:border-emerald-800/60"
                    }`}
                    title={planViaTeam ? tPlans("viaTeamHint") : undefined}
                  >
                    {planLabel}
                    {planViaTeam ? ` · ${tPlans("viaTeam")}` : ""}
                  </Link>
                ) : null}
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              <ThemeSwitcher />
              <LocaleSwitcher />
              <InstallPwaButton compact />
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 dark:border-violet-800/60 dark:bg-violet-950/60 dark:text-violet-200 dark:hover:bg-violet-900/60"
                >
                  {tNav("admin")}
                </Link>
              ) : null}
              <SignOutButton compact />
            </div>
          </div>

          {/* Mobile Sleek Single-Row App Bar */}
          <div className="flex lg:hidden items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link href="/dashboard" className="shrink-0 flex items-center">
                <Image
                  src="/icons/brand-logo.png"
                  alt={tCommon("appName")}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain shrink-0 drop-shadow-xs"
                />
              </Link>
              <WorkspaceSwitcher
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                className="min-w-0 flex-1 max-w-[190px] sm:max-w-xs"
              />
              {planLabel && planId !== "free" && (
                <Link
                  href="/dashboard/plan"
                  className="shrink-0 rounded-md bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950/60 dark:border-violet-800/60 dark:text-violet-200"
                >
                  {planLabel}
                </Link>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <InstallPwaButton compact />
              <ThemeSwitcher />
              <LocaleSwitcher />
            </div>
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
            <div className="my-2 border-t border-neutral-200 dark:border-[#26302C]" />
            <p className="px-3 py-1 text-xs font-semibold text-neutral-400 dark:text-[#66706B]">{tNav("more")}</p>
            {DESKTOP_MORE_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} label={tNav(item.labelKey)} />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Native-Grade Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#E4DFD3] bg-[#FBF9F4] pb-[max(0.85rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] lg:hidden dark:border-[#26302C] dark:bg-[#161E1B]">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-2 pb-0.5">
          {/* 1. Home */}
          <Link
            href="/dashboard"
            prefetch={true}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 transition active:scale-95 ${
              isActive(pathname, "/dashboard", true)
                ? "text-[#065F46] dark:text-[#34D399]"
                : "text-[#1C1B1A]/60 hover:text-[#065F46] dark:text-[#9AA39F] dark:hover:text-[#34D399]"
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
              isActive(pathname, "/dashboard/transactions")
                ? "text-[#065F46] dark:text-[#34D399]"
                : "text-[#1C1B1A]/60 hover:text-[#065F46] dark:text-[#9AA39F] dark:hover:text-[#34D399]"
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
              aria-label={tNav("quickActions.button")}
              className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#064E3B] to-[#059669] text-white shadow-lg shadow-emerald-950/30 ring-4 ring-[#FBF9F4] transition active:scale-90 dark:ring-[#161E1B]"
            >
              <NavIcon name="plus" className="h-6 w-6" />
            </button>
          </div>

          {/* 4. Invoices */}
          <Link
            href="/dashboard/invoices"
            prefetch={true}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 transition active:scale-95 ${
              isActive(pathname, "/dashboard/invoices")
                ? "text-[#065F46] dark:text-[#34D399]"
                : "text-[#1C1B1A]/60 hover:text-[#065F46] dark:text-[#9AA39F] dark:hover:text-[#34D399]"
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
            className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 text-[#1C1B1A]/60 transition hover:text-[#065F46] active:scale-95 dark:text-[#9AA39F] dark:hover:text-[#34D399]"
          >
            <NavIcon name="more" className="h-5 w-5" />
            <span className="text-[10px] font-semibold truncate">{tNav("more")}</span>
          </button>
        </div>
      </nav>

      <QuickAddActionSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        tNav={tNav}
      />
      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        tNav={tNav}
        locale={locale}
        userName={userName}
        planLabel={planLabel}
        isAdmin={isAdmin}
      />
    </div>
  );
}
