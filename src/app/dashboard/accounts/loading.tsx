import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function AccountsLoading() {
  return <PageSkeleton cardsCount={2} rowsCount={4} />;
}
