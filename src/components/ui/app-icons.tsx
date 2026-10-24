"use client";

import type { ReactNode } from "react";
import type { CategoryKind } from "@/models/category";
import { categorySlugToIconKey, type CategoryIconKey } from "@/lib/icons/category-slugs";

export type NavIconKey =
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
  | "plus"
  | "wallet"
  | "arrow-left"
  | "repeat"
  | "alert"
  | "users"
  | "folder"
  | "inbox"
  | "download"
  | "key"
  | "trash"
  | "smartphone"
  | "banknote"
  | "landmark"
  | "trending-up"
  | "trending-down"
  | "tag"
  | "phone"
  | "chat"
  | "check";

type SvgProps = { className?: string; strokeWidth?: number };

function Svg({ className, strokeWidth = 2, children }: SvgProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function NavIcon({ name, className = "h-5 w-5" }: { name: NavIconKey; className?: string }) {
  switch (name) {
    case "home":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </Svg>
      );
    case "transactions":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </Svg>
      );
    case "invoices":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </Svg>
      );
    case "clients":
    case "users":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </Svg>
      );
    case "projects":
    case "folder":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </Svg>
      );
    case "reports":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </Svg>
      );
    case "accounts":
    case "wallet":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </Svg>
      );
    case "debts":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </Svg>
      );
    case "budgets":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </Svg>
      );
    case "goals":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </Svg>
      );
    case "team":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </Svg>
      );
    case "categories":
    case "tag":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </Svg>
      );
    case "backup":
    case "download":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </Svg>
      );
    case "plan":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </Svg>
      );
    case "settings":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </Svg>
      );
    case "more":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </Svg>
      );
    case "plus":
      return (
        <Svg className={className} strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </Svg>
      );
    case "arrow-left":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </Svg>
      );
    case "repeat":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </Svg>
      );
    case "alert":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </Svg>
      );
    case "inbox":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </Svg>
      );
    case "key":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </Svg>
      );
    case "trash":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </Svg>
      );
    case "smartphone":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </Svg>
      );
    case "banknote":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </Svg>
      );
    case "landmark":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M5 6l7-3 7 3M4 10h16v11H4V10z" />
        </Svg>
      );
    case "trending-up":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </Svg>
      );
    case "trending-down":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </Svg>
      );
    case "phone":
      return (
        <Svg className={className}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </Svg>
      );
    case "chat":
      return (
        <Svg className={className}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </Svg>
      );
    case "check":
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </Svg>
      );
    default:
      return (
        <Svg className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </Svg>
      );
  }
}

const ACCOUNT_TYPE_ICON: Record<string, NavIconKey> = {
  cash: "banknote",
  bank: "landmark",
  mobile_wallet: "smartphone",
  credit_card: "wallet",
  savings: "plan",
  other: "folder",
};

export function AccountTypeIcon({
  type,
  className = "h-5 w-5",
}: {
  type: string;
  className?: string;
}) {
  const key = ACCOUNT_TYPE_ICON[type] ?? "wallet";
  return <NavIcon name={key} className={className} />;
}

function categoryKeyToNav(key: CategoryIconKey): NavIconKey {
  const map: Record<CategoryIconKey, NavIconKey> = {
    briefcase: "folder",
    users: "users",
    cart: "inbox",
    wrench: "settings",
    plus: "plus",
    food: "tag",
    car: "transactions",
    home: "home",
    bag: "inbox",
    heart: "alert",
    cpu: "settings",
    wifi: "repeat",
    monitor: "folder",
    megaphone: "alert",
    payroll: "users",
    bolt: "goals",
    card: "wallet",
    dots: "more",
    tag: "tag",
  };
  return map[key] ?? "tag";
}

export function CategoryIcon({
  slug,
  kind,
  className = "h-4 w-4",
}: {
  slug?: string | null;
  kind?: CategoryKind;
  className?: string;
}) {
  const key = categorySlugToIconKey(slug, kind);
  return <NavIcon name={categoryKeyToNav(key)} className={className} />;
}

export function TransactionKindIcon({
  type,
  className = "h-4 w-4",
}: {
  type: "income" | "expense";
  className?: string;
}) {
  return (
    <NavIcon
      name={type === "income" ? "trending-up" : "trending-down"}
      className={className}
    />
  );
}
