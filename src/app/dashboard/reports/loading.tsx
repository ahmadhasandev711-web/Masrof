import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function ReportsLoading() {
  return <PageSkeleton cardsCount={3} rowsCount={4} />;
}
