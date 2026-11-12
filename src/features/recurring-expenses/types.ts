import type { RecurringFrequency } from "@/models/recurring-expense";

export type RecurringExpenseListItem = {
  id: string;
  amount: number;
  description: string;
  frequency: RecurringFrequency;
  nextDueDate: string;
  accountName: string;
  categoryName: string;
  categoryNameEn: string | null;
  categorySlug: string | null;
};
