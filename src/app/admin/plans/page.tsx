import { getTranslations } from "next-intl/server";
import { PlanConfigForm } from "@/features/admin/components/plan-config-form";
import { getPlanConfigsForAdmin } from "@/features/subscriptions/plan-config-data";

export default async function AdminPlansPage() {
  const [t, configs] = await Promise.all([
    getTranslations("admin.plans"),
    getPlanConfigsForAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-8">
        {configs.map((config) => (
          <PlanConfigForm key={config.planId} config={config} />
        ))}
      </div>
    </div>
  );
}
