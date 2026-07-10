"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

function NavLink({
  href,
  label,
  icon,
  exact,
  className,
}: {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-[#ECFDF5] text-[#065F46]"
          : "text-[#1C1B1A]/70 hover:bg-[#F3F0E8] hover:text-[#065F46]"
      } ${className ?? ""}`}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </Link>
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
  const planLabel = planId ? tPlans(planId) : undefined;
  const personalPlanLabel =
    planViaTeam && personalPlanId && personalPlanId !== planId
      ? tPlans(personalPlanId)
      : null;

  return (
    <div className="min-h-screen bg-[#FBF9F4] pb-20 text-[#1C1B1A] lg:pb-8">
      <header className="border-b border-[#E4DFD3]/80 bg-[#FBF9F4]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div>
            <Link href="/dashboard" className="text-lg font-semibold text-[#065F46]">
              {tCommon("appName")}
            </Link>
            <p className="text-xs text-[#1C1B1A]/50">
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
              {personalPlanLabel ? (
                <span className="ms-1 text-[#1C1B1A]/40">
                  ({tPlans("yourPlan", { plan: personalPlanLabel })})
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <InstallPwaButton />
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm text-violet-800 transition hover:bg-violet-100 sm:inline-block"
              >
                {tNav("admin")}
              </Link>
            )}
            <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
            <Link
              href="/dashboard/workspaces/new"
              className="hidden rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-50 sm:inline-block"
            >
              {tNav("addWorkspace")}
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 lg:px-8">
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

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#E4DFD3] bg-[#FBF9F4]/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              label={tNav(item.labelKey)}
              className="flex-col gap-0.5 px-2 py-1.5 text-xs"
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
