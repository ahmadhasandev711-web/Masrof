import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function InvoicesLoading() {
  return <PageSkeleton cardsCount={4} rowsCount={5} />;
}
