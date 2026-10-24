import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function CategoriesLoading() {
  return <PageSkeleton cardsCount={3} rowsCount={5} />;
}
