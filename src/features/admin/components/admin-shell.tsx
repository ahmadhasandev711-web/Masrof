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
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-violet-100 text-violet-900"
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
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <div>
            <Link href="/admin" className="text-lg font-semibold text-violet-800">
              {tShell("title")}
            </Link>
            <p className="text-xs text-neutral-500">{tShell("greeting", { name: userName })}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              {tShell("financeApp")}
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              {tShell("website")}
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="flex flex-row gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-2 lg:flex-col lg:overflow-visible">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              labelKey={item.labelKey}
              exact={"exact" in item ? item.exact : false}
            />
          ))}
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
