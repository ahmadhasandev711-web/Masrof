import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function MembersLoading() {
  return <PageSkeleton cardsCount={2} rowsCount={4} />;
}
