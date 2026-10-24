import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function PlanLoading() {
  return <PageSkeleton cardsCount={2} rowsCount={3} />;
}
