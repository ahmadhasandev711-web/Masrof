import { getTranslations } from "next-intl/server";
import { listAppUsers } from "@/features/admin/data";
import { AdminUsersTable } from "@/features/admin/components/admin-users-table";

export default async function AdminUsersPage() {
  const t = await getTranslations("admin.users");
  const allUsers = await listAppUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <AdminUsersTable users={allUsers} />
    </div>
  );
}
