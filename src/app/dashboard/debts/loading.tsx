import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function DebtsLoading() {
  return <PageSkeleton cardsCount={3} rowsCount={3} />;
}
