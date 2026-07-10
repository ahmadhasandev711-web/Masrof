import { getFormatter, getTranslations } from "next-intl/server";
import { listAppUsers } from "@/features/admin/data";
import { UserSubscriptionControls } from "@/features/admin/components/user-subscription-controls";

export default async function AdminUsersPage() {
  const [t, tPlans, format] = await Promise.all([
    getTranslations("admin.users"),
    getTranslations("plans"),
    getFormatter(),
  ]);
  const users = await listAppUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-right text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("name")}</th>
              <th className="px-4 py-3 font-medium">{t("email")}</th>
              <th className="px-4 py-3 font-medium">{t("plan")}</th>
              <th className="px-4 py-3 font-medium">{t("status")}</th>
              <th className="px-4 py-3 font-medium">{t("registeredAt")}</th>
              <th className="px-4 py-3 font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{user.name}</td>
                <td className="px-4 py-3 text-neutral-600" dir="ltr">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800">
                    {tPlans(user.subscription.plan)}
                  </span>
                  {user.subscription.expiresAt && (
                    <p className="mt-1 text-xs text-neutral-400">
                      {t("validUntil")}{" "}
                      {format.dateTime(new Date(user.subscription.expiresAt), {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {user.subscription.isSuspended ? (
                    <span className="text-red-600">{t("suspended")}</span>
                  ) : user.subscription.status === "cancelled" ? (
                    <span className="text-amber-600">{t("cancelled")}</span>
                  ) : user.emailVerified ? (
                    <span className="text-emerald-700">{t("active")}</span>
                  ) : (
                    <span className="text-neutral-400">{t("unverified")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {user.createdAt
                    ? format.dateTime(new Date(user.createdAt), {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <UserSubscriptionControls
                    userId={user.id}
                    currentPlan={user.subscription.plan}
                    isSuspended={user.subscription.isSuspended}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
