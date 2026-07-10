import { getFormatter, getTranslations } from "next-intl/server";
import { listSubscribers } from "@/features/admin/data";
import { unsubscribeSubscriberAction } from "@/features/admin/actions/subscribers";

export default async function AdminSubscribersPage() {
  const [t, format] = await Promise.all([
    getTranslations("admin.subscribers"),
    getFormatter(),
  ]);
  const subscribers = await listSubscribers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("email")}</th>
              <th className="px-4 py-3 font-medium">{t("status")}</th>
              <th className="px-4 py-3 font-medium">{t("source")}</th>
              <th className="px-4 py-3 font-medium">{t("subscribedAt")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {subscribers.map((subscriber) => (
              <tr key={String(subscriber._id)} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900" dir="ltr">
                  {subscriber.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      subscriber.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {subscriber.status === "active" ? t("active") : t("cancelled")}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">{subscriber.source ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {subscriber.createdAt
                    ? format.dateTime(new Date(subscriber.createdAt), {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {subscriber.status === "active" && (
                    <form
                      action={unsubscribeSubscriberAction.bind(null, String(subscriber._id))}
                    >
                      <button type="submit" className="text-sm text-red-600 hover:underline">
                        {t("cancel")}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {subscribers.length === 0 && (
          <p className="px-4 py-10 text-center text-neutral-400">{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
