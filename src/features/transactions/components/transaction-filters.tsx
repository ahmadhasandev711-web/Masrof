import { useTranslations } from "next-intl";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

export function TransactionFiltersForm({
  accounts,
  categories,
  currentFilters,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  currentFilters: {
    type?: string;
    accountId?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
}) {
  const tFilters = useTranslations("forms.transactionFilters");
  const tTransaction = useTranslations("forms.transaction");
  const tCommon = useTranslations("common");
  return (
    <form
      method="get"
      className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
    >
      <input
        type="text"
        name="search"
        placeholder={tFilters("search")}
        defaultValue={currentFilters.search}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
      />

      <select
        name="type"
        defaultValue={currentFilters.type ?? ""}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
      >
        <option value="">{tFilters("allTypes")}</option>
        <option value="income">{tTransaction("income")}</option>
        <option value="expense">{tTransaction("expense")}</option>
      </select>

      <select
        name="accountId"
        defaultValue={currentFilters.accountId ?? ""}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
      >
        <option value="">{tFilters("allAccounts")}</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <select
        name="categoryId"
        defaultValue={currentFilters.categoryId ?? ""}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
      >
        <option value="">{tFilters("allCategories")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          name="dateFrom"
          defaultValue={currentFilters.dateFrom}
          className="rounded-lg border border-neutral-300 px-2 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
        />
        <input
          type="date"
          name="dateTo"
          defaultValue={currentFilters.dateTo}
          className="rounded-lg border border-neutral-300 px-2 py-2 text-right text-sm focus:border-emerald-600 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 lg:col-span-5"
      >
        {tCommon("filter")}
      </button>
    </form>
  );
}
