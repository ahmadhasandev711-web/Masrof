"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { WorkspaceSwitcher } from "@/features/workspaces/components/workspace-switcher";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { InstallPwaButton } from "@/features/dashboard/components/install-pwa-button";
import type { PlanId } from "@/features/subscriptions/plans";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "home", icon: "🏠", exact: true },
  { href: "/dashboard/transactions", labelKey: "transactions", icon: "📋" },
  { href: "/dashboard/clients", labelKey: "clients", icon: "👤" },
  { href: "/dashboard/projects", labelKey: "projects", icon: "📁" },
  { href: "/dashboard/reports", labelKey: "reports", icon: "📈" },
] as const;

const MORE_NAV_ITEMS = [
  { href: "/dashboard/workspaces/members", labelKey: "team", icon: "👥" },
  { href: "/dashboard/accounts", labelKey: "accounts", icon: "💳" },
  { href: "/dashboard/categories", labelKey: "categories", icon: "🏷️" },
  { href: "/dashboard/budgets", labelKey: "budgets", icon: "📊" },
  { href: "/dashboard/invoices", labelKey: "invoices", icon: "🧾" },
  { href: "/dashboard/goals", labelKey: "goals", icon: "🎯" },
  { href: "/dashboard/import", labelKey: "import", icon: "🏦" },
  { href: "/dashboard/backup", labelKey: "backup", icon: "💾" },
  { href: "/dashboard/plan", labelKey: "plan", icon: "⭐" },
] as const;

type WorkspaceOption = {
  id: string;
  name: string;
  type: string;
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMoreActive(pathname: string) {
  return MORE_NAV_ITEMS.some((item) => isActive(pathname, item.href));
}

function NavLink({
  href,
  label,
  icon,
  exact,
  className,
  iconOnly = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  className?: string;
  iconOnly?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-[#ECFDF5] text-[#065F46]"
          : "text-[#1C1B1A]/70 hover:bg-[#F3F0E8] hover:text-[#065F46]"
      } ${className ?? ""}`}
    >
      <span aria-hidden className="text-base leading-none">
        {icon}
      </span>
      {!iconOnly ? <span className="truncate">{label}</span> : null}
    </Link>
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
        className="absolute inset-0 bg-black/40"
        aria-label={tNav("closeMenu")}
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-[#E4DFD3] bg-[#FBF9F4] pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#E4DFD3] bg-[#FBF9F4] px-4 py-3">
          <p className="font-semibold text-[#065F46]">{tNav("more")}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            {tNav("closeMenu")}
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-2 p-4">
          {MORE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              label={tNav(item.labelKey)}
              onNavigate={onClose}
              className="gap-2 px-3 py-3"
            />
          ))}
          <Link
            href="/dashboard/workspaces/new"
            onClick={onClose}
            className="col-span-2 rounded-lg border border-dashed border-neutral-300 px-3 py-3 text-center text-sm text-neutral-600 hover:bg-neutral-50"
          >
            {tNav("newWorkspace")}
          </Link>
        </nav>
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
  const planLabel = planId ? tPlans(planId) : undefined;
  const personalPlanLabel =
    planViaTeam && personalPlanId && personalPlanId !== planId
      ? tPlans(personalPlanId)
      : null;
  const moreActive = isMoreActive(pathname);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FBF9F4] pb-[calc(5rem+env(safe-area-inset-bottom))] text-[#1C1B1A] lg:pb-8">
      <header className="border-b border-[#E4DFD3]/80 bg-[#FBF9F4]/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 lg:px-8 lg:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link href="/dashboard" className="text-lg font-semibold text-[#065F46]">
                {tCommon("appName")}
              </Link>
              <p className="truncate text-xs text-[#1C1B1A]/50">
                {tNav("greeting", { name: userName })}
                {planLabel ? (
                  <Link
                    href="/dashboard/plan"
                    className={`ms-1 rounded px-1.5 py-0.5 ${
                      planId !== "free"
                        ? "bg-violet-50 text-violet-700"
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
              <Link
                href="/dashboard/workspaces/new"
                className="hidden rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-50 sm:inline-block"
              >
                {tNav("addWorkspace")}
              </Link>
              <SignOutButton compact />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 lg:hidden">
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

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4 sm:py-6 lg:px-8">
        <aside className="hidden w-44 shrink-0 lg:block">
          <nav className="sticky top-6 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} label={tNav(item.labelKey)} />
            ))}
            <div className="my-2 border-t border-neutral-200" />
            <p className="px-3 py-1 text-xs font-medium text-neutral-400">{tNav("more")}</p>
            {MORE_NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} label={tNav(item.labelKey)} />
            ))}
            <div className="my-2 border-t border-neutral-200" />
            <Link
              href="/dashboard/workspaces/new"
              className="rounded-lg px-3 py-2 text-sm text-neutral-500 transition hover:bg-neutral-100 hover:text-emerald-700"
            >
              {tNav("newWorkspace")}
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#E4DFD3] bg-[#FBF9F4]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              label={tNav(item.labelKey)}
              iconOnly
              className="min-w-0 flex-1 flex-col gap-0.5 px-1 py-2 text-xs"
            />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label={tNav("more")}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-xs font-medium transition ${
              moreActive
                ? "bg-[#ECFDF5] text-[#065F46]"
                : "text-[#1C1B1A]/70 hover:bg-[#F3F0E8] hover:text-[#065F46]"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              ⋯
            </span>
          </button>
        </div>
      </nav>

      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} tNav={tNav} />
    </div>
  );
}
