import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function BudgetsLoading() {
  return <PageSkeleton cardsCount={4} rowsCount={3} />;
}
