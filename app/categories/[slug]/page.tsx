import { Suspense } from "react";
import { notFound } from "next/navigation";
import { gameCategories, isGameCategorySlug } from "@/lib/game-categories";
import GameSearch from "@/app/game-search";

async function CategoryCatalog({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isGameCategorySlug(slug)) notFound();

  const category = gameCategories[slug];
  return (
    <GameSearch
      initialSections={[]}
      initialCategory={{ slug, title: category.title }}
    />
  );
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<GameSearch initialSections={[]} initialLoading />}>
      <CategoryCatalog params={params} />
    </Suspense>
  );
}
