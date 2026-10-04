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
  adminQuickExtendUserSubscriptionAction,
} from "@/features/admin/actions/user-admin-ops";
import {
  cancelUserSubscriptionAction,
  suspendUserAction,
  reactivateUserAction,
} from "@/features/admin/actions/user-subscriptions";

type FilterType = "all" | "owners" | "pro" | "free" | "unverified" | "suspended";

export function AdminUsersTable({ users }: { users: AppUserWithWorkspaces[] }) {
  const t = useTranslations("admin.users");
  const tPlans = useTranslations("plans");
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
      u.workspaces.some((ws) => ws.name.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // 2. Chip Filter
    switch (activeFilter) {
      case "owners":
        return u.isOwner;
      case "pro":
        return u.subscription.plan === "pro";
      case "free":
        return u.subscription.plan === "free";
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
            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-800 placeholder-neutral-400 shadow-2xs focus:border-neutral-400 focus:outline-hidden"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
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
              { key: "pro", label: `${t("filterPro")} (${users.filter((u) => u.subscription.plan === "pro").length})` },
              { key: "free", label: `${t("filterFree")} (${users.filter((u) => u.subscription.plan === "free").length})` },
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
                  ? "bg-neutral-900 text-white shadow-2xs"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-xs">
        <table className="w-full min-w-[950px] text-right text-xs">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-semibold">
            <tr>
              <th className="px-4 py-3">{t("name")}</th>
              <th className="px-4 py-3">{t("email")}</th>
              <th className="px-4 py-3">{t("workspacesCol")}</th>
              <th className="px-4 py-3">{t("plan")}</th>
              <th className="px-4 py-3">{t("status")}</th>
              <th className="px-4 py-3">{t("registeredAt")}</th>
              <th className="px-4 py-3 text-left">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                  {t("noWorkspaces")}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const ownedWorkspaces = user.workspaces.filter((w) => w.role === "owner");
                const daysLeft = getDaysRemaining(user.subscription.expiresAt);

                return (
                  <tr key={user.id} className="hover:bg-neutral-50/70 transition">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 font-bold text-xs uppercase">
                          {user.name.charAt(0) || "U"}
                        </div>
                        <span className="font-bold text-neutral-900">{user.name}</span>
                      </div>
                    </td>

                    {/* Email & Verification status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <span className="font-mono text-neutral-600">{user.email}</span>
                        {user.emailVerified ? (
                          <span
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px]"
                            title="بريد مؤكد"
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200/60"
                            title="بريد غير مؤكد"
                          >
                            ⚠️
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
                                  ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                                  : "bg-blue-50 text-blue-700 border border-blue-200/60"
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
                        <span className="text-neutral-400">{t("noWorkspaces")}</span>
                      )}
                    </td>

                    {/* Plan & Expiration details */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold w-fit ${
                            user.subscription.plan === "pro"
                              ? "bg-violet-50 text-violet-800 border border-violet-200/70"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {tPlans(user.subscription.plan)}
                        </span>
                        {user.subscription.plan === "pro" && user.subscription.expiresAt && (
                          <span className="text-[10px] text-neutral-500">
                            {daysLeft !== null && daysLeft > 0 ? (
                              <span className={daysLeft <= 7 ? "text-amber-600 font-bold" : "text-neutral-500"}>
                                {t("daysRemaining", { days: daysLeft })}
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold">{t("expired")}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {user.subscription.isSuspended ? (
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700 border border-rose-200/60">
                          {t("suspended")}
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 border border-emerald-200/60">
                          {t("active")}
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
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
                            className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-2xs transition disabled:opacity-50"
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
                          className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition disabled:opacity-50"
                          title={t("sendPasswordReset")}
                        >
                          🔑
                        </button>

                        {/* 3. Quick Extension Buttons (if owner/pro) */}
                        {ownedWorkspaces.length > 0 && !user.subscription.isSuspended && (
                          <>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                run(() =>
                                  adminQuickExtendUserSubscriptionAction(user.id, {
                                    extendDays: 7,
                                  }),
                                );
                              }}
                              className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100 shadow-2xs transition disabled:opacity-50"
                              title="منح 7 أيام سماح"
                            >
                              +7ي
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                run(() =>
                                  adminQuickExtendUserSubscriptionAction(user.id, {
                                    durationMonths: 1,
                                  }),
                                );
                              }}
                              className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition disabled:opacity-50"
                              title="تمديد شهر كامل"
                            >
                              +1ش
                            </button>
                          </>
                        )}

                        {/* 4. Edit User Modal Button */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleOpenEdit(user)}
                          className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition disabled:opacity-50"
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
                            className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 shadow-2xs transition disabled:opacity-50"
                          >
                            {t("suspend")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => run(() => reactivateUserAction(user.id, "free"))}
                            className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition disabled:opacity-50"
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
                          className="rounded-md px-1.5 py-1 text-[11px] text-neutral-400 hover:text-rose-600 transition disabled:opacity-50"
                          title={t("deleteUser")}
                        >
                          🗑️
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-neutral-900">{t("editUserTitle")}</h3>
            <p className="mt-0.5 text-xs text-neutral-500">ID: {editingUser.id}</p>

            <form onSubmit={handleSaveEdit} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">{t("name")}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-800 focus:outline-hidden focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600">{t("email")}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-mono text-neutral-800 focus:outline-hidden focus:border-neutral-500"
                />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
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
