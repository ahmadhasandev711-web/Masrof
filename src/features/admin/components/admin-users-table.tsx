"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { AppUserWithWorkspaces } from "@/features/admin/data";
import {
  adminVerifyUserEmailAction,
  adminTriggerPasswordResetAction,
  adminEditUserInfoAction,
  adminDeleteUserAction,
} from "@/features/admin/actions/user-admin-ops";
import {
  cancelUserSubscriptionAction,
  suspendUserAction,
  reactivateUserAction,
} from "@/features/admin/actions/user-subscriptions";

type FilterType = "owners" | "all" | "unverified" | "suspended";

export function AdminUsersTable({ users }: { users: AppUserWithWorkspaces[] }) {
  const t = useTranslations("admin.users");
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("owners");

  // Edit Modal state
  const [editingUser, setEditingUser] = useState<AppUserWithWorkspaces | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  function run(action: () => Promise<{ error: string | null; success: boolean; message?: string }>) {
    startTransition(async () => {
      const res = await action();
      if (res.error) {
        window.alert(res.error);
      } else if (res.message) {
        window.alert(res.message);
      }
    });
  }

  // Filter & Search computation
  const filteredUsers = users.filter((u) => {
    // 1. Text search
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.phone && u.phone.includes(query)) ||
      u.workspaces.some((ws) => ws.name.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // 2. Chip Filter
    switch (activeFilter) {
      case "owners":
        return u.isOwner;
      case "unverified":
        return !u.emailVerified;
      case "suspended":
        return u.subscription.isSuspended;
      case "all":
      default:
        return true;
    }
  });

  function getDaysRemaining(expiresAt: string | null): number | null {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function handleOpenEdit(user: AppUserWithWorkspaces) {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    run(async () => {
      const res = await adminEditUserInfoAction(editingUser.id, {
        name: editName,
        email: editEmail,
      });
      if (res.success) {
        setEditingUser(null);
      }
      return res;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls: Search Bar & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative min-w-[280px] max-w-md flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-800 placeholder-neutral-400 shadow-2xs focus:border-neutral-400 focus:outline-hidden dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:placeholder-[#66706B] dark:focus:border-[#34D399]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 dark:text-[#66706B] dark:hover:text-[#ECEAE4]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(
            [
              { key: "owners", label: `${t("filterOwners")} (${users.filter((u) => u.isOwner).length})` },
              { key: "all", label: `${t("filterAll")} (${users.length})` },
              { key: "unverified", label: `${t("filterUnverified")} (${users.filter((u) => !u.emailVerified).length})` },
              { key: "suspended", label: `${t("filterSuspended")} (${users.filter((u) => u.subscription.isSuspended).length})` },
            ] as const
          ).map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActiveFilter(chip.key)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                activeFilter === chip.key
                  ? "bg-neutral-900 text-white shadow-2xs dark:bg-[#10B981] dark:text-[#04231A]"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 dark:bg-[#161E1B] dark:text-[#9AA39F] dark:border-[#26302C] dark:hover:bg-[#1E2824]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Users Cards List */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-xs text-neutral-400 dark:border-[#26302C] dark:bg-[#161E1B] dark:text-[#66706B]">
            {t("noWorkspaces")}
          </div>
        ) : (
          filteredUsers.map((user) => {
            return (
              <div
                key={user.id}
                className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex flex-col gap-3 dark:border-[#26302C] dark:bg-[#161E1B]"
              >
                {/* Header: Avatar, Name, Email, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-800 font-bold text-sm uppercase dark:bg-[#1E2824] dark:text-[#ECEAE4]">
                      {user.name.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-neutral-900 truncate dark:text-[#ECEAE4]">{user.name}</p>
                        {user.emailVerified ? (
                          <span
                            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold dark:bg-[#10B981]/20 dark:text-[#34D399]"
                            title="بريد مؤكد"
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            className="inline-flex shrink-0 items-center rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                            title="بريد غير مؤكد"
                          >
                            !
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-neutral-500 truncate dark:text-[#9AA39F]" dir="ltr">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {user.subscription.isSuspended ? (
                    <span className="shrink-0 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40">
                      {t("suspended")}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200/60 dark:bg-[#10B981]/20 dark:text-[#34D399] dark:border-[#34D399]/30">
                      {t("active")}
                    </span>
                  )}
                </div>

                {/* Phone & Workspaces */}
                <div className="flex flex-col gap-2 rounded-xl bg-neutral-50/80 p-2.5 text-xs dark:bg-[#1E2824]">
                  {user.phone ? (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium dark:text-[#9AA39F]">رقم الهاتف:</span>
                      <a
                        href={`https://wa.me/${user.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        dir="ltr"
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-[#34D399]"
                        title="مراسلة عبر واتساب"
                      >
                        <span>💬</span>
                        <span>{user.phone}</span>
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-[#10B981]/20 dark:text-[#34D399]">واتساب</span>
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-medium dark:text-[#9AA39F]">رقم الهاتف:</span>
                      <span className="text-neutral-400 font-mono text-[11px] dark:text-[#66706B]">—</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 border-t border-neutral-200/60 pt-2 dark:border-[#26302C]">
                    <span className="text-neutral-500 font-medium shrink-0 dark:text-[#9AA39F]">{t("workspacesCol")}:</span>
                    {user.workspaces.length > 0 ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        {user.workspaces.map((ws) => (
                          <Link
                            key={ws.id}
                            href={`/admin/workspaces/${ws.id}`}
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium hover:opacity-80 transition ${
                              ws.role === "owner"
                                ? "bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40"
                                : "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40"
                            }`}
                          >
                            <span>{ws.name}</span>
                            <span className="text-[9px] opacity-70">
                              ({ws.role === "owner" ? t("roleOwner") : t("roleMember")})
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-neutral-400 text-[11px] dark:text-[#66706B]">{t("noWorkspaces")}</span>
                    )}
                  </div>
                </div>

                {/* Mobile Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-neutral-100 dark:border-[#26302C]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!user.emailVerified && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(() => adminVerifyUserEmailAction(user.id))}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition disabled:opacity-50 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
                        title={t("verifyEmail")}
                      >
                         {t("verifyEmail")}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleOpenEdit(user)}
                      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition disabled:opacity-50 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
                    >
                      {t("editUser")}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        if (window.confirm(t("confirmResetPassword"))) {
                          run(() => adminTriggerPasswordResetAction(user.id));
                        }
                      }}
                      className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition disabled:opacity-50 flex items-center gap-1 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
                      title={t("sendPasswordReset")}
                    >
                      <svg className="h-3.5 w-3.5 text-neutral-500 dark:text-[#9AA39F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!user.subscription.isSuspended ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          if (window.confirm(t("confirmSuspend"))) {
                            run(() => suspendUserAction(user.id));
                          }
                        }}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 shadow-2xs transition disabled:opacity-50 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      >
                        {t("suspend")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(() => reactivateUserAction(user.id, "free"))}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition disabled:opacity-50 dark:border-[#34D399]/30 dark:bg-[#10B981]/20 dark:text-[#34D399]"
                      >
                        {t("reactivate")}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        if (window.confirm(t("confirmDeleteUser", { name: user.name }))) {
                          run(() => adminDeleteUserAction(user.id));
                        }
                      }}
                      className="rounded-lg p-1 text-xs text-neutral-400 hover:text-rose-600 transition disabled:opacity-50 dark:text-[#66706B] dark:hover:text-rose-400"
                      title={t("deleteUser")}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Users Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-[#26302C] dark:bg-[#161E1B]">
        <table className="w-full min-w-[950px] text-right text-xs">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-semibold dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#9AA39F]">
            <tr>
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3">{t("email")}</th>
              <th className="px-4 py-3">{t("workspacesCol")}</th>
              <th className="px-4 py-3">رقم الهاتف</th>
              <th className="px-4 py-3">{t("status")}</th>
              <th className="px-4 py-3">{t("registeredAt")}</th>
              <th className="px-4 py-3 text-left">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-[#26302C]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-400 dark:text-[#66706B]">
                  {t("noWorkspaces")}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const ownedWorkspaces = user.workspaces.filter((w) => w.role === "owner");

                return (
                  <tr key={user.id} className="hover:bg-neutral-50/70 transition dark:hover:bg-[#1E2824]">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs uppercase dark:bg-[#1E2824] dark:text-[#ECEAE4]">
                          {user.name.charAt(0) || "U"}
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-[#ECEAE4]">{user.name}</span>
                      </div>
                    </td>

                    {/* Email & Verification status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <span className="font-mono text-neutral-600 dark:text-[#9AA39F]">{user.email}</span>
                        {user.emailVerified ? (
                          <span
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold dark:bg-[#10B981]/20 dark:text-[#34D399]"
                            title="بريد مؤكد"
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                            title="بريد غير مؤكد"
                          >
                            !
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Workspaces list */}
                    <td className="px-4 py-3">
                      {user.workspaces.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.workspaces.map((ws) => (
                            <Link
                              key={ws.id}
                              href={`/admin/workspaces/${ws.id}`}
                              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium hover:opacity-80 transition ${
                                ws.role === "owner"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40"
                                  : "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/40"
                              }`}
                            >
                              <span>{ws.name}</span>
                              <span className="opacity-60 text-[9px]">
                                ({ws.role === "owner" ? t("roleOwner") : t("roleMember")})
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 dark:text-[#66706B]">{t("noWorkspaces")}</span>
                      )}
                    </td>

                    {/* Phone / WhatsApp */}
                    <td className="px-4 py-3">
                      {user.phone ? (
                        <a
                          href={`https://wa.me/${user.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          dir="ltr"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-semibold dark:text-[#34D399]"
                          title="مراسلة عبر واتساب"
                        >
                          <span>💬</span>
                          <span>{user.phone}</span>
                        </a>
                      ) : (
                        <span className="text-neutral-400 font-mono text-[11px] dark:text-[#66706B]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {user.subscription.isSuspended ? (
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/40">
                          {t("suspended")}
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 border border-emerald-200/60 dark:bg-[#10B981]/20 dark:text-[#34D399] dark:border-[#34D399]/30">
                          {t("active")}
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px] dark:text-[#9AA39F]">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* Operational Actions */}
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {/* 1. Email Verification Button (if unverified) */}
                        {!user.emailVerified && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              if (window.confirm(t("confirmVerifyEmail"))) {
                                run(() => adminVerifyUserEmailAction(user.id));
                              }
                            }}
                            className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-2xs transition disabled:opacity-50 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
                            title={t("confirmVerifyEmail")}
                          >
                            {t("verifyEmail")}
                          </button>
                        )}

                        {/* 2. Password Reset Action */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            if (window.confirm(t("confirmSendPasswordReset"))) {
                              run(() => adminTriggerPasswordResetAction(user.id));
                            }
                          }}
                          className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition disabled:opacity-50 flex items-center gap-1 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
                          title={t("sendPasswordReset")}
                        >
                          <svg className="h-3 w-3 text-neutral-500 dark:text-[#9AA39F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>

                        {/* 3. Edit User Modal Button */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleOpenEdit(user)}
                          className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition disabled:opacity-50 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
                        >
                          {t("editUser")}
                        </button>

                        {/* 5. Suspend / Reactivate */}
                        {!user.subscription.isSuspended ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              if (window.confirm(t("confirmSuspend"))) {
                                run(() => suspendUserAction(user.id));
                              }
                            }}
                            className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 shadow-2xs transition disabled:opacity-50 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
                          >
                            {t("suspend")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => run(() => reactivateUserAction(user.id, "free"))}
                            className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition disabled:opacity-50 dark:border-[#34D399]/30 dark:bg-[#10B981]/20 dark:text-[#34D399]"
                          >
                            {t("reactivate")}
                          </button>
                        )}

                        {/* 6. Delete User Account */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            if (window.confirm(t("confirmDeleteUser", { name: user.name }))) {
                              run(() => adminDeleteUserAction(user.id));
                            }
                          }}
                          className="rounded-md px-1.5 py-1 text-[11px] text-neutral-400 hover:text-rose-600 transition disabled:opacity-50 dark:text-[#66706B] dark:hover:text-rose-400"
                          title={t("deleteUser")}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal Dialog */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150 dark:border-[#26302C] dark:bg-[#161E1B]">
            <h3 className="text-base font-bold text-neutral-900 dark:text-[#ECEAE4]">{t("editUserTitle")}</h3>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-[#9AA39F]">ID: {editingUser.id}</p>

            <form onSubmit={handleSaveEdit} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">{t("name")}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-800 focus:outline-hidden focus:border-neutral-500 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:focus:border-[#34D399]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">{t("email")}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-mono text-neutral-800 focus:outline-hidden focus:border-neutral-500 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:focus:border-[#34D399]"
                />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
                >
                  {isPending ? "جارِ الحفظ..." : t("saveUser")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
