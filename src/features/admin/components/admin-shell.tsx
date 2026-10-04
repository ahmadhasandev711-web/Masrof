"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

const NAV = [
  { href: "/admin", labelKey: "overview", exact: true },
  { href: "/admin/workspaces", labelKey: "workspaces" },
  { href: "/admin/users", labelKey: "users" },
  { href: "/admin/plans", labelKey: "plans" },
] as const;

function NavLink({
  href,
  labelKey,
  exact,
}: {
  href: string;
  labelKey: "overview" | "workspaces" | "users" | "plans";
  exact?: boolean;
}) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition ${
        active
          ? "bg-violet-100 text-violet-900 shadow-2xs"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      {t(labelKey)}
    </Link>
  );
}

export function AdminShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const tShell = useTranslations("admin.shell");

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
          <div className="min-w-0">
            <Link href="/admin" className="text-base sm:text-lg font-bold text-violet-800 truncate block">
              {tShell("title")}
            </Link>
            <p className="text-[11px] sm:text-xs text-neutral-500 truncate max-w-[160px] sm:max-w-none">
              {tShell("greeting", { name: userName })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-semibold sm:px-3 sm:py-1.5 sm:text-sm text-neutral-700 hover:bg-neutral-50 transition whitespace-nowrap"
            >
              {tShell("financeApp")}
            </Link>
            <Link
              href="/"
              className="hidden sm:inline-block rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-semibold sm:px-3 sm:py-1.5 sm:text-sm text-neutral-700 hover:bg-neutral-50 transition whitespace-nowrap"
            >
              {tShell("website")}
            </Link>
            <SignOutButton compact />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="flex flex-row gap-1.5 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-1.5 sm:p-2 lg:flex-col lg:overflow-visible scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              labelKey={item.labelKey}
              exact={"exact" in item ? item.exact : false}
            />
          ))}
        </aside>
        <main className="min-w-0 w-full overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
