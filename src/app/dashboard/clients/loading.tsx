import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function ClientsLoading() {
  return <PageSkeleton cardsCount={4} rowsCount={4} />;
}
