import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function GoalsLoading() {
  return <PageSkeleton cardsCount={4} rowsCount={3} />;
}
