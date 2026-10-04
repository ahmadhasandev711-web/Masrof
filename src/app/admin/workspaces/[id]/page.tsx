import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { getAdminWorkspaceDetails } from "@/features/admin/workspace-details-data";
import { WorkspacePlanControls } from "@/features/admin/components/workspace-plan-controls";
import { WorkspacePreviewButton } from "@/features/admin/components/workspace-preview-button";
import { WorkspaceMembersAdminControls } from "@/features/admin/components/workspace-members-admin-controls";
import { WorkspaceSettingsAdminCard } from "@/features/admin/components/workspace-settings-admin-card";
import { WorkspaceUsageRadar } from "@/features/admin/components/workspace-usage-radar";
import { WorkspaceAdminNotesCard } from "@/features/admin/components/workspace-admin-notes-card";
import { formatMoney } from "@/lib/money";

type PageProps = {
  params: Promise<{ id: string }>;
};

function ArrowLeftIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    return "2" + digits;
  }
  return digits;
}

export default async function AdminWorkspaceDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const [t, tPlans, format] = await Promise.all([
    getTranslations("admin.workspaces"),
    getTranslations("plans"),
    getFormatter(),
  ]);

  const details = await getAdminWorkspaceDetails(id);
  if (!details) {
    notFound();
  }

  const { workspace, owner, metrics, members } = details;

  const getTypeLabel = (type: string) => {
    if (type === "business") return t("typeBusiness");
    if (type === "freelance") return t("typeFreelance");
    return t("typePersonal");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Link href="/admin/workspaces" className="hover:text-neutral-900 transition flex items-center gap-1">
            <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" />
            <span>{t("title")}</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-neutral-900">{workspace.name}</span>
        </div>

        {/* Live Support Preview Button */}
        <WorkspacePreviewButton workspaceId={workspace.id} />
      </div>

      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-lg sm:text-xl shadow-xs">
            {workspace.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">{workspace.name}</h1>
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                {getTypeLabel(workspace.type)}
              </span>
              {workspace.isArchived ? (
                <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                  {t("archived")}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {t("active")}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-neutral-400 truncate">
              {t("currency")}: {workspace.currency} • {t("createdAt")}:{" "}
              {format.dateTime(new Date(workspace.createdAt), {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Subscription Badge */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs text-neutral-500">{t("plan")}:</span>
              <span className="rounded-md bg-violet-600 px-2 py-0.5 text-xs font-bold text-white">
                {tPlans(workspace.plan)}
              </span>
            </div>
            {workspace.planExpiresAt && (
              <p className="mt-1 text-[11px] text-violet-700 font-medium">
                {t("validUntil")}{" "}
                {format.dateTime(new Date(workspace.planExpiresAt), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Plan Management & Workspace Settings */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Workspace Plan Controls Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">{t("managePlan")}</h2>
            <p className="mt-1 text-xs text-neutral-500 mb-4">{t("managePlanHint")}</p>
          </div>
          <WorkspacePlanControls
            workspaceId={workspace.id}
            currentPlan={workspace.plan}
            isSuspended={workspace.planStatus === "suspended"}
          />
        </div>

        {/* Workspace Settings Card (Edit Name, Type, Currency, Danger Zone) */}
        <WorkspaceSettingsAdminCard
          workspace={{
            id: workspace.id,
            name: workspace.name,
            type: workspace.type,
            currency: workspace.currency,
            businessPhone: workspace.businessPhone,
            isArchived: workspace.isArchived,
          }}
        />
      </div>

      {/* Row: Owner Details Card & Financial Metrics */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Owner Information Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">{t("ownerInfo")}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">{t("ownerName")}</span>
                <span className="font-semibold text-neutral-900">{owner.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-500">{t("ownerEmail")}</span>
                <span className="font-mono text-xs text-neutral-700" dir="ltr">
                  {owner.email}
                </span>
              </div>
              {workspace.businessPhone && (
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <span className="text-neutral-500">{t("businessPhone")}</span>
                  <span className="font-mono text-xs text-neutral-700" dir="ltr">
                    {workspace.businessPhone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {workspace.businessPhone && (
            <a
              href={`https://wa.me/${normalizePhoneForWhatsApp(workspace.businessPhone)}?text=${encodeURIComponent(
                t("whatsappDefaultMessage", { ownerName: owner.name, workspaceName: workspace.name })
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
            >
              <span>💬</span>
              <span>{t("whatsappOwner")}</span>
            </a>
          )}
        </div>

        {/* Activity & Financial Metrics Cards */}
        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2 sm:grid-rows-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
            <p className="text-xs text-neutral-500">{t("invoicesCount")}</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{metrics.invoicesCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
            <p className="text-xs text-neutral-500">{t("invoicesVolume")}</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">
              {formatMoney(metrics.invoicesTotalMinor, { currency: workspace.currency })}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
            <p className="text-xs text-neutral-500">{t("clientsCount")}</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{metrics.clientsCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
            <p className="text-xs text-neutral-500">{t("projectsCount")}</p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{metrics.projectsCount}</p>
          </div>
        </div>
      </div>

      {/* Row: Usage & Quota Radar + Admin Notes Card */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WorkspaceUsageRadar
          plan={workspace.plan}
          invoicesThisMonth={metrics.invoicesThisMonth}
          clientsCount={metrics.clientsCount}
          membersCount={members.length}
          limits={metrics.limits}
          isLimitReached={metrics.isLimitReached}
        />
        <WorkspaceAdminNotesCard
          workspaceId={workspace.id}
          initialNotes={workspace.adminNotes || ""}
          workspaceName={workspace.name}
        />
      </div>

      {/* Workspace Staff / Members Table with Full Admin Management */}
      <WorkspaceMembersAdminControls workspaceId={workspace.id} members={members} />
    </div>
  );
}
