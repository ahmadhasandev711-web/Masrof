import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function TransactionsLoading() {
  return <PageSkeleton cardsCount={4} rowsCount={6} />;
}
