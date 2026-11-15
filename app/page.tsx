import { Suspense } from "react";
import { connection } from "next/server";
import { queryIgdb } from "@/lib/igdb";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";
import { gameCategories, type GameCategorySlug } from "@/lib/game-categories";
import GameSearch, { type GameSection } from "./game-search";

type IgdbGame = {
  id: number;
  name: string;
  cover?: { url?: string } | null;
};

const catalogSections = (Object.entries(gameCategories) as [
  GameCategorySlug,
  (typeof gameCategories)[GameCategorySlug],
][])
  .map(([slug, category]) => ({
  ...category,
  slug,
  query: category.homeQuery,
  }));

async function loadSection(
  title: string,
  slug: GameCategorySlug,
  query: string,
): Promise<GameSection> {
  try {
    const games = await queryIgdb<IgdbGame>("games", query);
    return {
      title,
      slug,
      games: games.map((game) => ({
        id: game.id,
        name: game.name,
        coverImage: getIgdbCoverImageUrl(game.cover?.url),
      })),
    };
  } catch {
    return {
      title,
      slug,
      games: [],
      error: "This list could not be loaded. Try again later.",
    };
  }
}

async function HomeCatalog() {
  await connection();

  const sections = await Promise.all(
    catalogSections.map(({ title, slug, query }) => loadSection(title, slug, query)),
  );
  return <GameSearch initialSections={sections} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <GameSearch
          initialSections={catalogSections.map(({ title }) => ({ title, games: [] }))}
          initialLoading
        />
      }
    >
      <HomeCatalog />
    </Suspense>
  );
}
